import { DEFAULT_DAILY_LIMITS, parseDailyLimit } from "./config";
import type { QuotaProvider, SecurityEnvironment } from "./types";

export type QuotaResult = "allowed" | "exhausted" | "unavailable";

export async function reserveGlobalQuota(
  provider: QuotaProvider,
  env: SecurityEnvironment,
): Promise<QuotaResult> {
  const namespace = env.GLOBAL_USAGE;
  const limit = parseDailyLimit(
    provider === "kimi"
      ? env.KIMI_DAILY_REQUEST_LIMIT
      : env.MINIMAX_DAILY_REQUEST_LIMIT,
    DEFAULT_DAILY_LIMITS[provider],
  );
  if (!namespace || limit === null) return "unavailable";

  try {
    const stub = namespace.get(
      namespace.idFromName("accentforge-global-usage"),
    );
    const response = await stub.fetch("https://quota.internal/reserve", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ provider, limit }),
      signal: AbortSignal.timeout(5_000),
    });
    if (response.status === 429) return "exhausted";
    return response.status === 200 ? "allowed" : "unavailable";
  } catch {
    return "unavailable";
  }
}
