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
});
