import type { PaidRoute, SecurityEnvironment } from "./types";

export async function passesRateLimits(
  request: Request,
  route: PaidRoute,
  env: SecurityEnvironment,
) {
  const binding =
    route === "polish"
      ? env.POLISH_RATE_LIMIT
      : route === "generate"
        ? env.GENERATE_RATE_LIMIT
        : env.SPEECH_RATE_LIMIT;
  if (!binding || !env.COMBINED_RATE_LIMIT) return false;

  // Only Cloudflare's own header is used. Never trust caller-supplied X-Forwarded-For.
  const clientKey = request.headers.get("cf-connecting-ip") || "unknown-client";
  try {
    const routeResult = await binding.limit({ key: clientKey });
    if (!routeResult.success) return false;
    const combinedResult = await env.COMBINED_RATE_LIMIT.limit({
      key: clientKey,
    });
    return combinedResult.success;
  } catch {
    return false;
  }
}
