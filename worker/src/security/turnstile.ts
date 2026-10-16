import {
  allowedHostnames,
  isLocalSecurityMode,
  TEST_SECRET_KEYS,
} from "./config";
import type { PaidRoute, SecurityEnvironment } from "./types";
import {
  recordTurnstileDiagnostic,
  type SiteverifyRejectionReason,
  type TurnstileDiagnosticCategory,
} from "./turnstile-diagnostics";

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstile(
  token: string,
  route: PaidRoute,
  requestUrl: URL,
  env: SecurityEnvironment,
  fetcher: typeof fetch = (input, init) => globalThis.fetch(input, init),
) {
  return (
    (await verifyTurnstileDetailed(token, route, requestUrl, env, fetcher))
      .category === "verified"
  );
}

export interface TurnstileVerificationResult {
  category: TurnstileDiagnosticCategory;
  reason?: SiteverifyRejectionReason;
}

// Both the paid routes and the temporary diagnostic use this exact validator.
export async function verifyTurnstileDetailed(
  token: string,
  route: PaidRoute,
  requestUrl: URL,
  env: SecurityEnvironment,
  fetcher: typeof fetch = (input, init) => globalThis.fetch(input, init),
): Promise<TurnstileVerificationResult> {
  const secret = env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    recordTurnstileDiagnostic(route, "before_siteverify", {
      reason: "security_config",
    });
    return { category: "before_siteverify" };
  }
  const local = isLocalSecurityMode(env, requestUrl);
  const form = new URLSearchParams({ secret, response: token });

  let response: Response;
  try {
    response = await fetcher(SITEVERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: form,
      signal: AbortSignal.timeout(8_000),
    });
  } catch {
    recordTurnstileDiagnostic(route, "siteverify_transport_failure");
    return { category: "siteverify_transport_failure" };
  }
  if (!response.ok) {
    recordTurnstileDiagnostic(route, "siteverify_http_failure", {
      siteverifyStatus: response.status,
    });
    return { category: "siteverify_http_failure" };
  }

  let result: unknown;
  try {
    result = await response.json();
  } catch {
    recordTurnstileDiagnostic(route, "siteverify_http_failure", {
      siteverifyStatus: response.status,
    });
    return { category: "siteverify_http_failure" };
  }
  if (!isRecord(result) || result.success !== true) {
    const reason = siteverifyRejectionReason(result);
    recordTurnstileDiagnostic(route, "siteverify_rejected", {
      siteverifyStatus: response.status,
      siteverifyReason: reason,
    });
    return { category: "siteverify_rejected", reason };
  }

  const hostname = result.hostname;
  const action = result.action;
  const officialLocalTestResponse =
    local &&
    TEST_SECRET_KEYS.has(secret) &&
    hostname === "example.com" &&
    (action === "" || action === undefined);
  if (
    !officialLocalTestResponse &&
    (typeof hostname !== "string" ||
      !allowedHostnames(env, local).includes(hostname.toLowerCase()))
  ) {
    recordTurnstileDiagnostic(route, "hostname_mismatch", {
      siteverifyStatus: response.status,
    });
    return { category: "hostname_mismatch" };
  }
  if (
    !officialLocalTestResponse &&
    action !== route &&
    !(local && TEST_SECRET_KEYS.has(secret) && action === "test")
  ) {
    recordTurnstileDiagnostic(route, "action_mismatch", {
      siteverifyStatus: response.status,
    });
    return { category: "action_mismatch" };
  }
  recordTurnstileDiagnostic(route, "verified", {
    siteverifyStatus: response.status,
  });
  return { category: "verified" };
}

function siteverifyRejectionReason(result: unknown): SiteverifyRejectionReason {
  if (!isRecord(result) || !Array.isArray(result["error-codes"]))
    return "other";
  const codes = result["error-codes"];
  if (
    codes.includes("invalid-input-secret") ||
    codes.includes("missing-input-secret")
  )
    return "invalid_secret";
  if (codes.includes("timeout-or-duplicate")) return "expired_or_replayed";
  if (
    codes.includes("invalid-input-response") ||
    codes.includes("missing-input-response")
  )
    return "invalid_response";
  return "other";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
