import { afterEach, describe, expect, it, vi } from "vitest";
import { exportJWK, generateKeyPair, SignJWT } from "jose";

import { app } from "../app";
import { handleTurnstileDiagnostic } from "./turnstile-diagnostic";
import { verifyTurnstileDetailed } from "./turnstile";
import type { PaidRoute, SecurityEnvironment } from "./types";

const origin = "https://accentforge.pages.dev";

function environment(overrides: Partial<SecurityEnvironment> = {}) {
  return {
    SECURITY_ENV: "production",
    API_ENABLED: "false",
    KIMI_ENABLED: "false",
    MINIMAX_ENABLED: "false",
    TURNSTILE_DIAGNOSTIC_ENABLED: "true",
    TURNSTILE_DIAGNOSTIC_EXPIRES_AT: new Date(Date.now() + 5 * 60_000)
      .toISOString()
      .replace(/\.\d{3}Z$/, "Z"),
    TURNSTILE_DIAGNOSTIC_ACCESS_TEAM_DOMAIN:
      "https://example-team.cloudflareaccess.com",
    TURNSTILE_DIAGNOSTIC_ACCESS_AUD: "example-audience",
    TURNSTILE_DIAGNOSTIC_OWNER_EMAIL: "owner@example.invalid",
    TURNSTILE_DIAGNOSTIC_RATE_LIMIT: {
      limit: vi.fn().mockResolvedValue({ success: true }),
    },
    TURNSTILE_SITE_KEY: "real-widget-placeholder",
    TURNSTILE_SECRET_KEY: "real-secret-placeholder",
    TURNSTILE_ALLOWED_HOSTNAMES: "accentforge.pages.dev",
    ALLOWED_ORIGINS: origin,
    GLOBAL_USAGE: {
      idFromName: vi.fn(),
      get: vi.fn(),
    } as unknown as DurableObjectNamespace,
    ...overrides,
  } satisfies SecurityEnvironment;
}

function request(
  body: unknown = { turnstileToken: "one-use-test-token" },
  options: { method?: string; origin?: string; url?: string } = {},
) {
  return new Request(options.url ?? `${origin}/api/turnstile-diagnostic`, {
    method: options.method ?? "POST",
    headers: {
      origin: options.origin ?? origin,
      "content-type": "application/json",
    },
    body:
      (options.method ?? "POST") === "POST" ? JSON.stringify(body) : undefined,
  });
}

function dependencies() {
  return {
    access: vi.fn().mockResolvedValue(true),
    verify: vi.fn().mockResolvedValue({ category: "verified" }),
  };
}

afterEach(() => vi.restoreAllMocks());

describe("isolated, non-paid Turnstile diagnostic", () => {
  it("is disabled by default, even with a valid-looking request", async () => {
    const deps = dependencies();
    const env = environment({ TURNSTILE_DIAGNOSTIC_ENABLED: "false" });
    const response = await handleTurnstileDiagnostic(request(), env, deps);
    expect(response.status).toBe(404);
    expect(deps.access).not.toHaveBeenCalled();
    expect(deps.verify).not.toHaveBeenCalled();
    expect(env.GLOBAL_USAGE?.get).not.toHaveBeenCalled();
    expect((await app.fetch(request(), { API_ENABLED: "false" })).status).toBe(
      404,
    );
  });

  it.each([
    ["master enabled", { API_ENABLED: "true" }],
    ["Kimi enabled", { KIMI_ENABLED: "true" }],
    ["MiniMax enabled", { MINIMAX_ENABLED: "true" }],
    ["missing expiry", { TURNSTILE_DIAGNOSTIC_EXPIRES_AT: undefined }],
    ["expired", { TURNSTILE_DIAGNOSTIC_EXPIRES_AT: "2020-01-01T00:00:00Z" }],
    ["invalid environment", { SECURITY_ENV: "development" }],
    [
      "local test secret",
      { TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA" },
    ],
  ] as const)("fails closed when %s", async (_name, overrides) => {
    const deps = dependencies();
    const response = await handleTurnstileDiagnostic(
      request(),
      environment(overrides),
      deps,
    );
    expect(response.status).toBe(404);
    expect(deps.access).not.toHaveBeenCalled();
    expect(deps.verify).not.toHaveBeenCalled();
  });

  it("requires exact production host, Origin and POST before any verification", async () => {
    const deps = dependencies();
    for (const badRequest of [
      request(undefined, {
        url: "https://preview.accentforge.pages.dev/api/turnstile-diagnostic",
      }),
      request(undefined, { origin: "https://other.example" }),
      request(undefined, { method: "GET" }),
    ]) {
      const response = await handleTurnstileDiagnostic(
        badRequest,
        environment(),
        deps,
      );
      expect(response.status).toBe(404);
    }
    expect(deps.access).not.toHaveBeenCalled();
    expect(deps.verify).not.toHaveBeenCalled();
  });

  it("does not reveal diagnostic details to an unauthenticated caller", async () => {
    const deps = dependencies();
    deps.access.mockResolvedValue(false);
    const response = await handleTurnstileDiagnostic(
      request(),
      environment(),
      deps,
    );
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ message: "Not found." });
    expect(deps.verify).not.toHaveBeenCalled();
  });

  it("enforces a dedicated one-per-minute binding and fails closed if absent", async () => {
    const deps = dependencies();
    const limiter = vi.fn().mockResolvedValue({ success: false });
    const response = await handleTurnstileDiagnostic(
      request(),
      environment({ TURNSTILE_DIAGNOSTIC_RATE_LIMIT: { limit: limiter } }),
      deps,
    );
    expect(response.status).toBe(429);
    expect(limiter).toHaveBeenCalledExactlyOnceWith({
      key: "turnstile-diagnostic-owner",
    });
    expect(deps.verify).not.toHaveBeenCalled();
    expect(
      (
        await handleTurnstileDiagnostic(
          request(),
          environment({ TURNSTILE_DIAGNOSTIC_RATE_LIMIT: undefined }),
          deps,
        )
      ).status,
    ).toBe(503);
  });

  it.each([
    ["missing", {}, "token_missing"],
    ["empty", { turnstileToken: "" }, "token_missing"],
    ["oversized", { turnstileToken: "x".repeat(2_049) }, "token_too_long"],
  ])("classifies %s tokens before Siteverify", async (_name, body, reason) => {
    const deps = dependencies();
    const response = await handleTurnstileDiagnostic(
      request(body),
      environment(),
      deps,
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      category: "before_siteverify",
      reason,
    });
    expect(deps.verify).not.toHaveBeenCalled();
  });

  it("returns verified without touching provider or paid quota", async () => {
    const deps = dependencies();
    const env = environment();
    const response = await handleTurnstileDiagnostic(request(), env, deps);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ category: "verified" });
    expect(response.headers.get("cache-control")).toBe("no-store, private");
    expect(deps.verify).toHaveBeenCalledOnce();
    expect(env.GLOBAL_USAGE?.get).not.toHaveBeenCalled();
  });

  it("completes the actual app route with signed owner JWT and mocked Siteverify only", async () => {
    const keys = await generateKeyPair("RS256", { extractable: true });
    const jwt = await new SignJWT({
      email: "owner@example.invalid",
      type: "app",
    })
      .setProtectedHeader({ alg: "RS256", kid: "test-key" })
      .setIssuer("https://example-team.cloudflareaccess.com")
      .setAudience("example-audience")
      .setSubject("owner-subject")
      .setExpirationTime(Math.floor(Date.now() / 1_000) + 60)
      .sign(keys.privateKey);
    const publicJwk = { ...(await exportJWK(keys.publicKey)), kid: "test-key" };
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith("/cdn-cgi/access/certs"))
        return Response.json({ keys: [publicJwk] });
      if (url.endsWith("/turnstile/v0/siteverify"))
        return Response.json({
          success: true,
          hostname: "accentforge.pages.dev",
          action: "polish",
        });
      throw new Error("An unexpected external request was attempted");
    });
    vi.stubGlobal("fetch", fetcher);
    vi.spyOn(console, "info").mockImplementation(() => {});
    const env = environment();
    const incoming = request();
    incoming.headers.set("cf-access-jwt-assertion", jwt);
    try {
      const response = await app.fetch(incoming, env);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ category: "verified" });
      expect(fetcher).toHaveBeenCalledTimes(2);
      expect(env.GLOBAL_USAGE?.get).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it.each([
    [
      "wrong Secret",
      { success: false, "error-codes": ["invalid-input-secret"] },
      "invalid_secret",
    ],
    [
      "expired/replayed",
      { success: false, "error-codes": ["timeout-or-duplicate"] },
      "expired_or_replayed",
    ],
    [
      "invalid token",
      { success: false, "error-codes": ["invalid-input-response"] },
      "invalid_response",
    ],
  ] as const)(
    "safely maps %s Siteverify rejection",
    async (_name, upstream, reason) => {
      vi.spyOn(console, "info").mockImplementation(() => {});
      const fetcher = vi
        .fn<typeof fetch>()
        .mockResolvedValue(Response.json(upstream));
      const deps = {
        access: vi.fn().mockResolvedValue(true),
        verify: (
          token: string,
          route: PaidRoute,
          url: URL,
          env: SecurityEnvironment,
        ) => verifyTurnstileDetailed(token, route, url, env, fetcher),
      };
      const env = environment();
      const response = await handleTurnstileDiagnostic(request(), env, deps);
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({
        category: "siteverify_rejected",
        reason,
      });
      expect(fetcher).toHaveBeenCalledOnce();
      expect(env.GLOBAL_USAGE?.get).not.toHaveBeenCalled();
    },
  );

  it.each([
    [
      "hostname",
      { success: true, hostname: "other.example", action: "polish" },
      "hostname_mismatch",
    ],
    [
      "action",
      { success: true, hostname: "accentforge.pages.dev", action: "speech" },
      "action_mismatch",
    ],
  ] as const)("classifies %s mismatch", async (_name, upstream, category) => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json(upstream));
    const response = await handleTurnstileDiagnostic(request(), environment(), {
      access: vi.fn().mockResolvedValue(true),
      verify: (token, route, url, env) =>
        verifyTurnstileDetailed(token, route, url, env, fetcher),
    });
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ category });
  });

  it("classifies Siteverify timeout and HTTP failure without exposing details", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    for (const [fetcher, category] of [
      [
        vi
          .fn<typeof fetch>()
          .mockRejectedValue(new Error("private network detail")),
        "siteverify_transport_failure",
      ],
      [
        vi
          .fn<typeof fetch>()
          .mockResolvedValue(new Response("private body", { status: 502 })),
        "siteverify_http_failure",
      ],
    ] as const) {
      const response = await handleTurnstileDiagnostic(
        request(),
        environment(),
        {
          access: vi.fn().mockResolvedValue(true),
          verify: (token, route, url, env) =>
            verifyTurnstileDetailed(token, route, url, env, fetcher),
        },
      );
      expect(response.status).toBe(502);
      const body = await response.text();
      expect(JSON.parse(body)).toEqual({ category });
      expect(body).not.toContain("private");
    }
  });
});
