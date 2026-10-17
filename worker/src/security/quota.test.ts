import { describe, expect, it, vi } from "vitest";

import { reserveGlobalQuota } from "./quota";
import type { SecurityEnvironment } from "./types";

function environment(status: number, limit = "2") {
  const fetch = vi.fn().mockResolvedValue(new Response(null, { status }));
  const idFromName = vi.fn().mockReturnValue("single-global-id");
  const get = vi.fn().mockReturnValue({ fetch });
  const env: SecurityEnvironment = {
    GLOBAL_USAGE: { idFromName, get } as unknown as DurableObjectNamespace,
    KIMI_DAILY_REQUEST_LIMIT: limit,
  };
  return { env, fetch, idFromName, get };
}

describe("shared quota reservation", () => {
  it.each([
    ["kimi", 4],
    ["minimax", 2],
  ] as const)(
    "uses the conservative %s default of %i when a limit is absent",
    async (provider, limit) => {
      const { env, fetch } = environment(200);
      delete env.KIMI_DAILY_REQUEST_LIMIT;
      await expect(reserveGlobalQuota(provider, env)).resolves.toBe("allowed");
      expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
        provider,
        limit,
      });
    },
  );

  it("uses one global Durable Object and reserves before provider execution", async () => {
    const { env, fetch, idFromName } = environment(200);
    await expect(reserveGlobalQuota("kimi", env)).resolves.toBe("allowed");
    expect(idFromName).toHaveBeenCalledWith("accentforge-global-usage");
    expect(fetch).toHaveBeenCalledOnce();
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
      provider: "kimi",
      limit: 2,
    });
  });

  it("distinguishes exhaustion from unavailable coordination", async () => {
    await expect(
      reserveGlobalQuota("kimi", environment(429).env),
    ).resolves.toBe("exhausted");
    await expect(
      reserveGlobalQuota("kimi", environment(500).env),
    ).resolves.toBe("unavailable");
    await expect(
      reserveGlobalQuota("kimi", environment(200, "invalid").env),
    ).resolves.toBe("unavailable");
    await expect(reserveGlobalQuota("minimax", {})).resolves.toBe(
      "unavailable",
    );
  });
});
