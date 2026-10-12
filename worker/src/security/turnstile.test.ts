import { describe, expect, it, vi } from "vitest";

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
  });

  it.each([
    ["invalid", { success: false, hostname: "app.example", action: "polish" }],
    [
      "expired or replayed",
      { success: false, "error-codes": ["timeout-or-duplicate"] },
    ],
    [
      "wrong action",
      { success: true, hostname: "app.example", action: "speech" },
    ],
    [
      "wrong hostname",
      { success: true, hostname: "other.example", action: "polish" },
    ],
    ["missing metadata", { success: true }],
  ])("rejects %s verification", async (_name, result) => {
    await expect(
      verifyTurnstile("token", "polish", url, env, response(result)),
    ).resolves.toBe(false);
  });

  it("fails closed on Siteverify network errors", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new Error("private connection detail"));
    await expect(
      verifyTurnstile("token", "polish", url, env, fetcher),
    ).resolves.toBe(false);
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
