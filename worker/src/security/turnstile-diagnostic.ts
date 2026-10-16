import { TEST_SECRET_KEYS, TEST_SITE_KEYS } from "./config";
import { verifyDiagnosticOwner } from "./diagnostic-access";
import { safeJson, secureResponse } from "./response";
import { verifyTurnstileDetailed } from "./turnstile";
import type { SecurityEnvironment } from "./types";

const PRODUCTION_ORIGIN = "https://accentforge.pages.dev";
const MAX_BODY_BYTES = 4_096;
const MAX_WINDOW_MS = 15 * 60 * 1_000;

type DiagnosticDependencies = {
  access?: typeof verifyDiagnosticOwner;
  verify?: typeof verifyTurnstileDetailed;
};

export async function handleTurnstileDiagnostic(
  request: Request,
  env: SecurityEnvironment,
  dependencies: DiagnosticDependencies = {},
): Promise<Response> {
  const url = new URL(request.url);
  const finish = (response: Response) =>
    secureResponse(response, PRODUCTION_ORIGIN);

  // This tool is not part of the paid-route switch system. It can run only
  // while all three paid switches are explicitly disabled, for <= 15 minutes.
  if (!diagnosticEnabled(env, url)) return finish(safeJson("Not found.", 404));
  if (request.method !== "POST") return finish(safeJson("Not found.", 404));
  if (request.headers.get("origin") !== PRODUCTION_ORIGIN)
    return finish(safeJson("Not found.", 404));

  const access = dependencies.access ?? verifyDiagnosticOwner;
  if (!(await access(request, env))) return finish(safeJson("Not found.", 404));

  const limiter = env.TURNSTILE_DIAGNOSTIC_RATE_LIMIT;
  if (!limiter) return finish(safeJson("Unavailable.", 503));
  try {
    if (!(await limiter.limit({ key: "turnstile-diagnostic-owner" })).success)
      return finish(safeJson("Please wait before trying again.", 429));
  } catch {
    return finish(safeJson("Unavailable.", 503));
  }

  const parsed = await diagnosticToken(request);
  if (parsed.category !== "ready") {
    return finish(
      Response.json(
        { category: "before_siteverify", reason: parsed.category },
        { status: 400 },
      ),
    );
  }

  const verify = dependencies.verify ?? verifyTurnstileDetailed;
  const result = await verify(parsed.token, "polish", url, env);
  return finish(
    Response.json(result, {
      status:
        result.category === "verified"
          ? 200
          : result.category === "siteverify_transport_failure" ||
              result.category === "siteverify_http_failure"
            ? 502
            : 403,
    }),
  );
}

function diagnosticEnabled(env: SecurityEnvironment, url: URL): boolean {
  const expiry = env.TURNSTILE_DIAGNOSTIC_EXPIRES_AT;
  const expiresAt =
    expiry && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(expiry)
      ? Date.parse(expiry)
      : NaN;
  const remaining = expiresAt - Date.now();
  return (
    url.origin === PRODUCTION_ORIGIN &&
    env.SECURITY_ENV === "production" &&
    env.TURNSTILE_DIAGNOSTIC_ENABLED === "true" &&
    env.API_ENABLED === "false" &&
    env.KIMI_ENABLED === "false" &&
    env.MINIMAX_ENABLED === "false" &&
    remaining > 0 &&
    remaining <= MAX_WINDOW_MS &&
    env.ALLOWED_ORIGINS === PRODUCTION_ORIGIN &&
    env.TURNSTILE_ALLOWED_HOSTNAMES === url.hostname &&
    Boolean(
      env.TURNSTILE_SITE_KEY &&
      !TEST_SITE_KEYS.has(env.TURNSTILE_SITE_KEY) &&
      env.TURNSTILE_SECRET_KEY &&
      !TEST_SECRET_KEYS.has(env.TURNSTILE_SECRET_KEY),
    )
  );
}

async function diagnosticToken(
  request: Request,
): Promise<
  | { category: "ready"; token: string }
  | { category: "invalid_request" | "token_missing" | "token_too_long" }
> {
  if (
    request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !==
    "application/json"
  )
    return { category: "invalid_request" };
  const declaredSize = Number(request.headers.get("content-length"));
  if (declaredSize > MAX_BODY_BYTES) return { category: "invalid_request" };
  if (!request.body) return { category: "invalid_request" };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BODY_BYTES) {
        void reader.cancel();
        return { category: "invalid_request" };
      }
      chunks.push(value);
    }
  } catch {
    return { category: "invalid_request" };
  } finally {
    reader.releaseLock();
  }

  let body: unknown;
  try {
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    body = JSON.parse(
      new TextDecoder("utf-8", { fatal: true, ignoreBOM: false }).decode(bytes),
    );
  } catch {
    return { category: "invalid_request" };
  }
  if (typeof body !== "object" || body === null || Array.isArray(body))
    return { category: "invalid_request" };
  const token = (body as Record<string, unknown>).turnstileToken;
  if (typeof token !== "string" || !token.trim())
    return { category: "token_missing" };
  if (token.length > 2_048) return { category: "token_too_long" };
  return { category: "ready", token };
}
