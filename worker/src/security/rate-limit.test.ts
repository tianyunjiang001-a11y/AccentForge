import { describe, expect, it, vi } from "vitest";

import { passesRateLimits } from "./rate-limit";
import type { SecurityEnvironment } from "./types";

describe("rate-limit bindings", () => {
  it("uses separate route and combined bindings", async () => {
    const route = { limit: vi.fn().mockResolvedValue({ success: true }) };
    const combined = { limit: vi.fn().mockResolvedValue({ success: true }) };
    const env: SecurityEnvironment = {
      POLISH_RATE_LIMIT: route,
      COMBINED_RATE_LIMIT: combined,
    };
    const request = new Request("https://worker.example/api/polish", {
      headers: {
        "CF-Connecting-IP": "192.0.2.42",
        "X-Forwarded-For": "198.51.100.5",
      },
    });
    await expect(passesRateLimits(request, "polish", env)).resolves.toBe(true);
    expect(route.limit).toHaveBeenCalledWith({ key: "192.0.2.42" });
    expect(combined.limit).toHaveBeenCalledWith({ key: "192.0.2.42" });
  });

  it("fails closed when a binding is missing or unavailable", async () => {
    await expect(
      passesRateLimits(new Request("https://worker.example"), "speech", {}),
    ).resolves.toBe(false);
    const env: SecurityEnvironment = {
      SPEECH_RATE_LIMIT: {
        limit: vi.fn().mockRejectedValue(new Error("binding failed")),
      },
      COMBINED_RATE_LIMIT: { limit: vi.fn() },
    };
    await expect(
      passesRateLimits(new Request("https://worker.example"), "speech", env),
    ).resolves.toBe(false);
  });

  it.each(["polish", "generate", "speech"] as const)(
    "uses the %s limiter and rejects the combined limiter before paid work",
    async (routeName) => {
      const polish = { limit: vi.fn().mockResolvedValue({ success: true }) };
      const generate = { limit: vi.fn().mockResolvedValue({ success: true }) };
      const speech = { limit: vi.fn().mockResolvedValue({ success: true }) };
      const combined = { limit: vi.fn().mockResolvedValue({ success: false }) };
      const env: SecurityEnvironment = {
        POLISH_RATE_LIMIT: polish,
        GENERATE_RATE_LIMIT: generate,
        SPEECH_RATE_LIMIT: speech,
        COMBINED_RATE_LIMIT: combined,
      };
      await expect(
        passesRateLimits(new Request("https://worker.example"), routeName, env),
      ).resolves.toBe(false);
      for (const [name, limiter] of Object.entries({
        polish,
        generate,
        speech,
      })) {
        expect(limiter.limit).toHaveBeenCalledTimes(name === routeName ? 1 : 0);
      }
      expect(combined.limit).toHaveBeenCalledOnce();
    },
  );
});
