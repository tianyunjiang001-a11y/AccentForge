import type { PaidRoute } from "./types";

export type TurnstileDiagnosticCategory =
  | "before_siteverify"
  | "siteverify_transport_failure"
  | "siteverify_http_failure"
  | "siteverify_rejected"
  | "hostname_mismatch"
  | "action_mismatch"
  | "verified";

export type SiteverifyRejectionReason =
  "invalid_secret" | "invalid_response" | "expired_or_replayed" | "other";

export type BeforeSiteverifyReason =
  | "api_disabled"
  | "security_config"
  | "untrusted_origin"
  | "invalid_request"
  | "missing_token"
  | "rate_limited";

export function recordTurnstileDiagnostic(
  route: PaidRoute,
  category: TurnstileDiagnosticCategory,
  status: {
    workerStatus?: number;
    siteverifyStatus?: number;
    reason?: BeforeSiteverifyReason;
    siteverifyReason?: SiteverifyRejectionReason;
  } = {},
) {
  // Only fixed categories and numeric status codes belong in operational logs.
  console.info("accentforge.turnstile", { route, category, ...status });
}
