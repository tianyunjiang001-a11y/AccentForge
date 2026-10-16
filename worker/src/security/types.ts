import type { ProviderEnvironment } from "../config/provider-config";

export type PaidRoute = "polish" | "generate" | "speech";
export type QuotaProvider = "kimi" | "minimax";

export interface RateLimitBinding {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export interface SecurityEnvironment extends ProviderEnvironment {
  SECURITY_ENV?: string;
  API_ENABLED?: string;
  KIMI_ENABLED?: string;
  MINIMAX_ENABLED?: string;
  TURNSTILE_SITE_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  TURNSTILE_ALLOWED_HOSTNAMES?: string;
  TURNSTILE_DIAGNOSTIC_ENABLED?: string;
  TURNSTILE_DIAGNOSTIC_EXPIRES_AT?: string;
  TURNSTILE_DIAGNOSTIC_ACCESS_TEAM_DOMAIN?: string;
  TURNSTILE_DIAGNOSTIC_ACCESS_AUD?: string;
  TURNSTILE_DIAGNOSTIC_OWNER_EMAIL?: string;
  ALLOWED_ORIGINS?: string;
  KIMI_DAILY_REQUEST_LIMIT?: string;
  MINIMAX_DAILY_REQUEST_LIMIT?: string;
  POLISH_RATE_LIMIT?: RateLimitBinding;
  GENERATE_RATE_LIMIT?: RateLimitBinding;
  SPEECH_RATE_LIMIT?: RateLimitBinding;
  COMBINED_RATE_LIMIT?: RateLimitBinding;
  TURNSTILE_DIAGNOSTIC_RATE_LIMIT?: RateLimitBinding;
  GLOBAL_USAGE?: DurableObjectNamespace;
}
