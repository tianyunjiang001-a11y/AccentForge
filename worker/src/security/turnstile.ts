import {
  allowedHostnames,
  isLocalSecurityMode,
  TEST_SECRET_KEYS,
} from "./config";
import type { PaidRoute, SecurityEnvironment } from "./types";
import { recordTurnstileDiagnostic } from "./turnstile-diagnostics";

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstile(
  token: string,
  route: PaidRoute,
  requestUrl: URL,
  env: SecurityEnvironment,
  fetcher: typeof fetch = (input, init) => globalThis.fetch(input, init),
) {
  const secret = env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    recordTurnstileDiagnostic(route, "before_siteverify", {
      reason: "security_config",
    });
    return false;
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
    return false;
  }
  if (!response.ok) {
    recordTurnstileDiagnostic(route, "siteverify_http_failure", {
      siteverifyStatus: response.status,
    });
    return false;
  }

  let result: unknown;
  try {
    result = await response.json();
  } catch {
    recordTurnstileDiagnostic(route, "siteverify_http_failure", {
      siteverifyStatus: response.status,
    });
    return false;
  }
  if (!isRecord(result) || result.success !== true) {
    recordTurnstileDiagnostic(route, "siteverify_rejected", {
      siteverifyStatus: response.status,
    });
    return false;
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
    return false;
  }
  if (
    !officialLocalTestResponse &&
    action !== route &&
    !(local && TEST_SECRET_KEYS.has(secret) && action === "test")
  ) {
    recordTurnstileDiagnostic(route, "action_mismatch", {
      siteverifyStatus: response.status,
    });
    return false;
  }
  recordTurnstileDiagnostic(route, "verified", {
    siteverifyStatus: response.status,
  });
  return true;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
