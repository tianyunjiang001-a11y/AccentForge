import type { PaidRoute, SecurityEnvironment } from "./types";

export const TEST_SITE_KEY = "1x00000000000000000000AA";
export const TEST_SITE_KEYS = new Set([
  TEST_SITE_KEY,
  "2x00000000000000000000AB",
  "1x00000000000000000000BB",
  "2x00000000000000000000BB",
  "3x00000000000000000000FF",
]);
export const TEST_SECRET_KEYS = new Set([
  "1x0000000000000000000000000000000AA",
  "2x0000000000000000000000000000000AA",
  "3x0000000000000000000000000000000AA",
]);

export const DEFAULT_DAILY_LIMITS = { kimi: 150, minimax: 40 } as const;

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

export function allowedHostnames(env: SecurityEnvironment, local: boolean) {
  const configured = env.TURNSTILE_ALLOWED_HOSTNAMES?.split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  if (configured?.length) return configured;
  return local ? ["localhost", "127.0.0.1"] : [];
}

export function isSecurityConfigured(
  env: SecurityEnvironment,
  requestUrl: URL,
) {
  const local = isLocalSecurityMode(env, requestUrl);
  const secret = env.TURNSTILE_SECRET_KEY ?? "";
  const siteKey = env.TURNSTILE_SITE_KEY ?? "";
  const origins = allowedOrigins(env, local);
  const hostnames = allowedHostnames(env, local);
  const testKeys = TEST_SECRET_KEYS.has(secret) || TEST_SITE_KEYS.has(siteKey);
  const validProductionOrigins = origins.every((origin) => {
    try {
      return new URL(origin).protocol === "https:";
    } catch {
      return false;
    }
  });

  return (
    Boolean(secret && siteKey && env.GLOBAL_USAGE) &&
    Boolean(
      env.POLISH_RATE_LIMIT &&
      env.GENERATE_RATE_LIMIT &&
      env.SPEECH_RATE_LIMIT &&
      env.COMBINED_RATE_LIMIT,
    ) &&
    origins.length > 0 &&
    hostnames.length > 0 &&
    (local || (!testKeys && validProductionOrigins)) &&
    (local ||
      !hostnames.some((host) => host === "localhost" || host === "127.0.0.1"))
  );
}
