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
  ALLOWED_ORIGINS?: string;
  KIMI_DAILY_REQUEST_LIMIT?: string;
  MINIMAX_DAILY_REQUEST_LIMIT?: string;
  POLISH_RATE_LIMIT?: RateLimitBinding;
  GENERATE_RATE_LIMIT?: RateLimitBinding;
  SPEECH_RATE_LIMIT?: RateLimitBinding;
  COMBINED_RATE_LIMIT?: RateLimitBinding;
  GLOBAL_USAGE?: DurableObjectNamespace;
}
