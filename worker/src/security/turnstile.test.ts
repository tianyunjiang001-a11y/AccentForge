import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { isSecurityConfigured } from "./config";
import { verifyTurnstile } from "./turnstile";
import type { SecurityEnvironment } from "./types";

const url = new URL("https://worker.example/api/polish");
const env: SecurityEnvironment = {
  TURNSTILE_SECRET_KEY: "server-only-placeholder",
  TURNSTILE_SITE_KEY: "public-placeholder",
  TURNSTILE_ALLOWED_HOSTNAMES: "app.example",
  ALLOWED_ORIGINS: "https://app.example",
};

function response(result: unknown) {
  return vi.fn<typeof fetch>().mockResolvedValue(Response.json(result));
}

beforeEach(() => vi.spyOn(console, "info").mockImplementation(() => {}));
afterEach(() => vi.restoreAllMocks());

describe("Turnstile Siteverify", () => {
  it("posts a token to official Siteverify and checks success, hostname and action", async () => {
    const fetcher = response({
      success: true,
      hostname: "app.example",
      action: "polish",
    });
    await expect(
      verifyTurnstile("one-use-token", "polish", url, env, fetcher),
    ).resolves.toBe(true);
    const [endpoint, init] = fetcher.mock.calls[0];
    expect(endpoint).toBe(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    );
    expect(init?.method).toBe("POST");
    const submitted = new URLSearchParams(String(init?.body));
    expect(submitted.get("response")).toBe("one-use-token");
    expect(submitted.get("secret")).toBe("server-only-placeholder");
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    expect(console.info).toHaveBeenCalledWith("accentforge.turnstile", {
      route: "polish",
      category: "verified",
      siteverifyStatus: 200,
    });
  });

  it.each([
    [
      "invalid",
      { success: false, hostname: "app.example", action: "polish" },
      "siteverify_rejected",
    ],
    [
      "expired or replayed",
      { success: false, "error-codes": ["timeout-or-duplicate"] },
      "siteverify_rejected",
    ],
    [
      "wrong action",
      { success: true, hostname: "app.example", action: "speech" },
      "action_mismatch",
    ],
    [
      "wrong hostname",
      { success: true, hostname: "other.example", action: "polish" },
      "hostname_mismatch",
    ],
    ["missing metadata", { success: true }, "hostname_mismatch"],
  ])("rejects %s verification", async (_name, result, category) => {
    await expect(
      verifyTurnstile("token", "polish", url, env, response(result)),
    ).resolves.toBe(false);
    expect(console.info).toHaveBeenCalledWith(
      "accentforge.turnstile",
      expect.objectContaining({
        route: "polish",
        category,
        siteverifyStatus: 200,
      }),
    );
  });

  it("fails closed on Siteverify network errors", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new Error("private connection detail"));
    await expect(
      verifyTurnstile("token", "polish", url, env, fetcher),
    ).resolves.toBe(false);
    expect(console.info).toHaveBeenCalledWith("accentforge.turnstile", {
      route: "polish",
      category: "siteverify_transport_failure",
    });
  });

  it("classifies Siteverify timeouts as transport failures", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new DOMException("request timed out", "TimeoutError"));
    await expect(
      verifyTurnstile("token", "polish", url, env, fetcher),
    ).resolves.toBe(false);
    expect(console.info).toHaveBeenLastCalledWith("accentforge.turnstile", {
      route: "polish",
      category: "siteverify_transport_failure",
    });
  });

  it("classifies HTTP errors and malformed Siteverify JSON as protocol failures", async () => {
    const unavailable = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 503 }));
    await expect(
      verifyTurnstile("token", "polish", url, env, unavailable),
    ).resolves.toBe(false);
    expect(console.info).toHaveBeenLastCalledWith("accentforge.turnstile", {
      route: "polish",
      category: "siteverify_http_failure",
      siteverifyStatus: 503,
    });

    const malformed = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("not json", { status: 200 }));
    await expect(
      verifyTurnstile("token", "polish", url, env, malformed),
    ).resolves.toBe(false);
    expect(console.info).toHaveBeenLastCalledWith("accentforge.turnstile", {
      route: "polish",
      category: "siteverify_http_failure",
      siteverifyStatus: 200,
    });
  });

  it("logs only safe categories and status codes, never credentials or learner data", async () => {
    const sensitiveToken = "private-token-do-not-log";
    const sensitiveSecret = "private-secret-do-not-log";
    const fetcher = response({
      success: false,
      "error-codes": ["private-upstream-detail-do-not-log"],
    });
    await verifyTurnstile(
      sensitiveToken,
      "polish",
      url,
      {
        ...env,
        TURNSTILE_SECRET_KEY: sensitiveSecret,
      },
      fetcher,
    );
    const logged = JSON.stringify(vi.mocked(console.info).mock.calls);
    expect(logged).toContain("siteverify_rejected");
    expect(logged).not.toContain(sensitiveToken);
    expect(logged).not.toContain(sensitiveSecret);
    expect(logged).not.toContain("private-upstream-detail");
    expect(logged).not.toContain("app.example");
    expect(logged).not.toContain("192.0.2.1");
  });

  it("accepts official test action only in local development", async () => {
    const localEnv = {
      ...env,
      SECURITY_ENV: "development",
      TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
      TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
      TURNSTILE_ALLOWED_HOSTNAMES: "localhost,127.0.0.1",
      ALLOWED_ORIGINS: "http://localhost:5173,http://127.0.0.1:5173",
    };
    const localUrl = new URL("http://127.0.0.1:8787/api/polish");
    await expect(
      verifyTurnstile(
        "XXXX.DUMMY.TOKEN.XXXX",
        "polish",
        localUrl,
        localEnv,
        response({ success: true, hostname: "localhost", action: "test" }),
      ),
    ).resolves.toBe(true);
    expect(isSecurityConfigured(localEnv, url)).toBe(false);
    await expect(
      verifyTurnstile(
        "XXXX.DUMMY.TOKEN.XXXX",
        "polish",
        localUrl,
        localEnv,
        response({ success: true, hostname: "example.com" }),
      ),
    ).resolves.toBe(true);
  });
});
