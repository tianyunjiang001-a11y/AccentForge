import {
  allowedHostnames,
  isLocalSecurityMode,
  TEST_SECRET_KEYS,
} from "./config";
import type { PaidRoute, SecurityEnvironment } from "./types";

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
  if (!secret) return false;
  const local = isLocalSecurityMode(env, requestUrl);
  const form = new URLSearchParams({ secret, response: token });

  try {
    const response = await fetcher(SITEVERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: form,
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return false;
    const result: unknown = await response.json();
    if (!isRecord(result)) return false;
    const hostname = result.hostname;
    const action = result.action;
    const officialLocalTestResponse =
      local &&
      TEST_SECRET_KEYS.has(secret) &&
      hostname === "example.com" &&
      (action === "" || action === undefined);
    return (
      result.success === true &&
      typeof hostname === "string" &&
      (officialLocalTestResponse ||
        (allowedHostnames(env, local).includes(hostname.toLowerCase()) &&
          (action === route ||
            (local && TEST_SECRET_KEYS.has(secret) && action === "test"))))
    );
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
