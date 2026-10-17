import type { PaidRoute, SecurityEnvironment } from "./types";

export const DEFAULT_DAILY_LIMITS = { kimi: 4, minimax: 2 } as const;

export function isLocalSecurityMode(env: SecurityEnvironment, url: URL) {
  return (
    env.SECURITY_ENV === "development" &&
    (url.hostname === "localhost" || url.hostname === "127.0.0.1")
  );
}

export function isPaidRouteEnabled(
  env: SecurityEnvironment,
  route: PaidRoute,
  requestUrl: URL,
) {
  const relevant = route === "speech" ? env.MINIMAX_ENABLED : env.KIMI_ENABLED;
  const validSecurityMode =
    env.SECURITY_ENV === "production" || isLocalSecurityMode(env, requestUrl);
  return validSecurityMode && env.API_ENABLED === "true" && relevant === "true";
}

export function parseDailyLimit(value: string | undefined, fallback: number) {
  if (value === undefined) return fallback;
  if (!/^[1-9]\d*$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed <= 100_000 ? parsed : null;
}

export function allowedOrigins(env: SecurityEnvironment, local: boolean) {
  const configured = env.ALLOWED_ORIGINS?.split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (configured?.length) return configured;
  return local ? ["http://127.0.0.1:5173", "http://localhost:5173"] : [];
}

export function isSecurityConfigured(
  env: SecurityEnvironment,
  requestUrl: URL,
) {
  const local = isLocalSecurityMode(env, requestUrl);
  const origins = allowedOrigins(env, local);
  const validOrigins = origins.every((origin) => {
    try {
      const parsed = new URL(origin);
      return (
        parsed.origin === origin &&
        (parsed.protocol === "https:" || (local && parsed.protocol === "http:"))
      );
    } catch {
      return false;
    }
  });

  return (
    Boolean(env.GLOBAL_USAGE) &&
    Boolean(
      env.POLISH_RATE_LIMIT &&
      env.GENERATE_RATE_LIMIT &&
      env.SPEECH_RATE_LIMIT &&
      env.COMBINED_RATE_LIMIT,
    ) &&
    origins.length > 0 &&
    validOrigins
  );
}
