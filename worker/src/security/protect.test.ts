import { describe, expect, it, vi } from "vitest";

import { protectPaidRoute } from "./protect";
import type { PaidRoute, SecurityEnvironment } from "./types";

const accepted = { limit: async () => ({ success: true }) };

function environment(
  overrides: Partial<SecurityEnvironment> = {},
): SecurityEnvironment {
  return {
    SECURITY_ENV: "production",
    API_ENABLED: "true",
    KIMI_ENABLED: "true",
    MINIMAX_ENABLED: "true",
    ALLOWED_ORIGINS: "https://app.example",
    POLISH_RATE_LIMIT: accepted,
    GENERATE_RATE_LIMIT: accepted,
    SPEECH_RATE_LIMIT: accepted,
    COMBINED_RATE_LIMIT: accepted,
    GLOBAL_USAGE: {} as DurableObjectNamespace,
    ...overrides,
  };
}

function validBody(route: PaidRoute) {
  if (route === "polish")
    return { rawChinese: "我喜欢咖啡", part: 1, targetBand: 6 };
  if (route === "generate")
    return {
      structuredChinese: "我喜欢咖啡",
      part: 1,
      targetBand: 6,
    };
  return {
    text: "I quite like coffee.",
    accent: "australian",
    voice: "male",
  };
}

function request(
  route: PaidRoute,
  body: unknown = validBody(route),
  options: {
    method?: string;
    contentType?: string;
    origin?: string;
  } = {},
) {
  return new Request(`https://worker.example/api/${route}`, {
    method: options.method ?? "POST",
    headers: {
      "content-type": options.contentType ?? "application/json",
      origin: options.origin ?? "https://app.example",
      "cf-connecting-ip": "192.0.2.1",
    },
    body: JSON.stringify(body),
  });
}

function dependencies() {
  return {
    rate: vi.fn().mockResolvedValue(true),
    quota: vi.fn().mockResolvedValue("allowed"),
  };
}

describe("paid route security chain", () => {
  it.each(["polish", "generate", "speech"] as const)(
    "protects %s independently before provider execution",
    async (route) => {
      const execute = vi.fn().mockResolvedValue(Response.json({ ok: true }));
      const deps = dependencies();
      const response = await protectPaidRoute(
        request(route),
        route,
        environment(),
        execute,
        deps,
      );
      expect(response.status).toBe(200);
      expect(deps.rate).toHaveBeenCalledOnce();
      expect(deps.quota).toHaveBeenCalledWith(
        route === "speech" ? "minimax" : "kimi",
        expect.any(Object),
      );
      expect(execute).toHaveBeenCalledOnce();
      expect(response.headers.get("cache-control")).toBe("no-store, private");
      expect(response.headers.get("access-control-allow-origin")).toBe(
        "https://app.example",
      );
      expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    },
  );

  it("rejects a missing Origin before rate limits, quota or a paid provider", async () => {
    const execute = vi.fn();
    const deps = dependencies();
    const missingOrigin = request("polish");
    missingOrigin.headers.delete("origin");
    const response = await protectPaidRoute(
      missingOrigin,
      "polish",
      environment(),
      execute,
      deps,
    );
    expect(response.status).toBe(403);
    expect(deps.rate).not.toHaveBeenCalled();
    expect(deps.quota).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });

  it.each(["null", "https://evil.example", "https://app.example.evil.test"])(
    "rejects untrusted Origin %s without reserving quota or calling a provider",
    async (origin) => {
      const execute = vi.fn();
      const deps = dependencies();
      const response = await protectPaidRoute(
        request("generate", validBody("generate"), { origin }),
        "generate",
        environment(),
        execute,
        deps,
      );
      expect(response.status).toBe(403);
      expect(deps.rate).not.toHaveBeenCalled();
      expect(deps.quota).not.toHaveBeenCalled();
      expect(execute).not.toHaveBeenCalled();
    },
  );

  it.each(["polish", "generate", "speech"] as const)(
    "rejects per-route rate limit on %s before quota/provider",
    async (route) => {
      const execute = vi.fn();
      const deps = dependencies();
      deps.rate.mockResolvedValue(false);
      const response = await protectPaidRoute(
        request(route),
        route,
        environment(),
        execute,
        deps,
      );
      expect(response.status).toBe(429);
      expect(deps.quota).not.toHaveBeenCalled();
      expect(execute).not.toHaveBeenCalled();
    },
  );

  it.each([
    ["polish", "exhausted", 429],
    ["generate", "exhausted", 429],
    ["speech", "exhausted", 429],
    ["polish", "unavailable", 503],
    ["generate", "unavailable", 503],
    ["speech", "unavailable", 503],
  ] as const)(
    "rejects %s when shared quota is %s before provider execution",
    async (route, result, status) => {
      const execute = vi.fn();
      const deps = dependencies();
      deps.quota.mockResolvedValue(result);
      const response = await protectPaidRoute(
        request(route),
        route,
        environment(),
        execute,
        deps,
      );
      expect(response.status).toBe(status);
      expect(execute).not.toHaveBeenCalled();
    },
  );

  it.each([
    [
      "all switches false",
      { API_ENABLED: "false", KIMI_ENABLED: "false", MINIMAX_ENABLED: "false" },
      "polish",
    ],
    ["main switch missing", { API_ENABLED: undefined }, "polish"],
    ["Kimi switch missing", { KIMI_ENABLED: undefined }, "generate"],
    ["MiniMax switch missing", { MINIMAX_ENABLED: undefined }, "speech"],
    ["main switch empty", { API_ENABLED: "" }, "polish"],
    ["main switch malformed", { API_ENABLED: "TRUE" }, "polish"],
    ["Kimi switch empty", { KIMI_ENABLED: "" }, "generate"],
    ["Kimi switch malformed", { KIMI_ENABLED: "1" }, "polish"],
    ["MiniMax switch empty", { MINIMAX_ENABLED: "" }, "speech"],
    ["MiniMax switch malformed", { MINIMAX_ENABLED: " true " }, "speech"],
    [
      "Kimi disabled while MiniMax enabled",
      { KIMI_ENABLED: "false" },
      "generate",
    ],
    [
      "MiniMax disabled while Kimi enabled",
      { MINIMAX_ENABLED: "false" },
      "speech",
    ],
    ["security environment missing", { SECURITY_ENV: undefined }, "polish"],
    ["security environment empty", { SECURITY_ENV: "" }, "generate"],
    ["security environment malformed", { SECURITY_ENV: "staging" }, "speech"],
    [
      "development mode on production host",
      { SECURITY_ENV: "development" },
      "polish",
    ],
  ] as const)(
    "fails closed for %s before external checks",
    async (_name, overrides, route) => {
      const execute = vi.fn();
      const deps = dependencies();
      const response = await protectPaidRoute(
        request(route),
        route,
        environment(overrides),
        execute,
        deps,
      );
      expect(response.status).toBe(503);
      expect(deps.rate).not.toHaveBeenCalled();
      expect(deps.quota).not.toHaveBeenCalled();
      expect(execute).not.toHaveBeenCalled();
    },
  );

  it.each(["localhost", "127.0.0.1"])(
    "permits explicitly enabled local development on %s",
    async (hostname) => {
      const execute = vi.fn().mockResolvedValue(Response.json({ ok: true }));
      const deps = dependencies();
      const localRequest = new Request(`http://${hostname}:8787/api/polish`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://127.0.0.1:5173",
        },
        body: JSON.stringify(validBody("polish")),
      });
      const response = await protectPaidRoute(
        localRequest,
        "polish",
        environment({
          SECURITY_ENV: "development",
          ALLOWED_ORIGINS: "http://127.0.0.1:5173",
        }),
        execute,
        deps,
      );
      expect(response.status).toBe(200);
      expect(execute).toHaveBeenCalledOnce();
    },
  );

  it.each([
    ["Kimi", "polish", { MINIMAX_ENABLED: "false" }],
    ["MiniMax", "speech", { KIMI_ENABLED: "false" }],
  ] as const)(
    "allows explicitly enabled %s while the other provider is disabled",
    async (_provider, route, overrides) => {
      const execute = vi.fn().mockResolvedValue(Response.json({ ok: true }));
      const response = await protectPaidRoute(
        request(route),
        route,
        environment(overrides),
        execute,
        dependencies(),
      );
      expect(response.status).toBe(200);
      expect(execute).toHaveBeenCalledOnce();
    },
  );

  it.each([
    ["missing allowed origins", { ALLOWED_ORIGINS: "" }],
    ["wildcard origin", { ALLOWED_ORIGINS: "*" }],
    ["HTTP production origin", { ALLOWED_ORIGINS: "http://app.example" }],
    ["origin with path", { ALLOWED_ORIGINS: "https://app.example/path" }],
    ["missing quota", { GLOBAL_USAGE: undefined }],
    ["missing rate binding", { SPEECH_RATE_LIMIT: undefined }],
  ] as const)("fails closed for %s", async (_name, overrides) => {
    const execute = vi.fn();
    const response = await protectPaidRoute(
      request("polish"),
      "polish",
      environment(overrides),
      execute,
      dependencies(),
    );
    expect(response.status).toBe(503);
    expect(execute).not.toHaveBeenCalled();
  });

  it.each([
    ["empty", {}],
    ["invalid part", { ...validBody("polish"), part: 4 }],
    [
      "oversized Unicode Chinese",
      { ...validBody("polish"), rawChinese: "汉".repeat(1001) },
    ],
  ])("rejects %s input before all chargeable calls", async (_name, body) => {
    const execute = vi.fn();
    const deps = dependencies();
    const response = await protectPaidRoute(
      request("polish", body),
      "polish",
      environment(),
      execute,
      deps,
    );
    expect(response.status).toBe(400);
    expect(deps.quota).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });

  it("rejects unsupported voice combinations at the Worker boundary", async () => {
    const execute = vi.fn();
    const deps = dependencies();
    const response = await protectPaidRoute(
      request("speech", {
        ...validBody("speech"),
        accent: "british",
        voice: "male",
      }),
      "speech",
      environment(),
      execute,
      deps,
    );
    expect(response.status).toBe(400);
    expect(deps.quota).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON and an oversized UTF-8 request body", async () => {
    const execute = vi.fn();
    const deps = dependencies();
    const malformed = new Request("https://worker.example/api/polish", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://app.example",
      },
      body: "{",
    });
    const badJson = await protectPaidRoute(
      malformed,
      "polish",
      environment(),
      execute,
      deps,
    );
    const oversized = await protectPaidRoute(
      request("polish", {
        ...validBody("polish"),
        rawChinese: "汉".repeat(3000),
      }),
      "polish",
      environment(),
      execute,
      deps,
    );
    expect(badJson.status).toBe(400);
    expect(oversized.status).toBe(413);
    expect(deps.quota).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });

  it("rejects invalid content type, method and untrusted Origin", async () => {
    const execute = vi.fn();
    const deps = dependencies();
    const wrongType = await protectPaidRoute(
      request("polish", validBody("polish"), { contentType: "text/plain" }),
      "polish",
      environment(),
      execute,
      deps,
    );
    const wrongOrigin = await protectPaidRoute(
      request("polish", validBody("polish"), {
        origin: "https://evil.example",
      }),
      "polish",
      environment(),
      execute,
      deps,
    );
    const wrongMethod = new Request("https://worker.example/api/polish", {
      method: "GET",
      headers: { origin: "https://app.example" },
    });
    const methodResponse = await protectPaidRoute(
      wrongMethod,
      "polish",
      environment(),
      execute,
      deps,
    );
    expect(wrongType.status).toBe(415);
    expect(wrongOrigin.status).toBe(403);
    expect(wrongOrigin.headers.get("access-control-allow-origin")).toBeNull();
    expect(methodResponse.status).toBe(405);
    expect(execute).not.toHaveBeenCalled();
  });

  it("answers only trusted CORS preflight without quota or provider work", async () => {
    const execute = vi.fn();
    const deps = dependencies();
    const trusted = new Request("https://worker.example/api/speech", {
      method: "OPTIONS",
      headers: { origin: "https://app.example" },
    });
    const untrusted = new Request("https://worker.example/api/speech", {
      method: "OPTIONS",
      headers: { origin: "https://other.example" },
    });
    const accepted = await protectPaidRoute(
      trusted,
      "speech",
      environment(),
      execute,
      deps,
    );
    const rejected = await protectPaidRoute(
      untrusted,
      "speech",
      environment(),
      execute,
      deps,
    );
    expect(accepted.status).toBe(204);
    expect(accepted.headers.get("access-control-allow-origin")).toBe(
      "https://app.example",
    );
    expect(rejected.status).toBe(403);
    expect(rejected.headers.get("access-control-allow-origin")).toBeNull();
    expect(deps.quota).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });
});
