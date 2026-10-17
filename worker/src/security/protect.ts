import {
  allowedOrigins,
  isLocalSecurityMode,
  isPaidRouteEnabled,
  isSecurityConfigured,
} from "./config";
import { reserveGlobalQuota } from "./quota";
import { passesRateLimits } from "./rate-limit";
import { checkPaidRequest } from "./request";
import { safeJson, secureResponse } from "./response";
import type { PaidRoute, SecurityEnvironment } from "./types";

export async function protectPaidRoute(
  request: Request,
  route: PaidRoute,
  env: SecurityEnvironment,
  execute: () => Promise<Response>,
  dependencies: {
    rate?: typeof passesRateLimits;
    quota?: typeof reserveGlobalQuota;
  } = {},
): Promise<Response> {
  const requestUrl = new URL(request.url);
  const local = isLocalSecurityMode(env, requestUrl);
  const origin = request.headers.get("origin");
  const trustedOrigin =
    origin && allowedOrigins(env, local).includes(origin) ? origin : null;
  const finish = (response: Response) =>
    secureResponse(response, trustedOrigin);

  if (request.method === "OPTIONS") {
    return finish(
      trustedOrigin
        ? new Response(null, { status: 204 })
        : safeJson("This request is not supported.", 403),
    );
  }
  if (!isPaidRouteEnabled(env, route, requestUrl)) {
    return finish(
      safeJson(
        "This feature is temporarily unavailable. Please try again later.",
        503,
      ),
    );
  }
  if (!isSecurityConfigured(env, requestUrl)) {
    return finish(
      safeJson(
        "This feature is temporarily unavailable. Please try again later.",
        503,
      ),
    );
  }
  if (!trustedOrigin) {
    return finish(safeJson("This request is not supported.", 403));
  }

  const checked = await checkPaidRequest(request, route);
  if (checked.error) return finish(checked.error);

  const rate = dependencies.rate ?? passesRateLimits;
  if (!(await rate(request, route, env))) {
    return finish(safeJson("Please wait a moment before trying again.", 429));
  }

  const quota = dependencies.quota ?? reserveGlobalQuota;
  const quotaResult = await quota(route === "speech" ? "minimax" : "kimi", env);
  if (quotaResult === "exhausted") {
    return finish(
      safeJson(
        "Today's availability has been reached. Please try again tomorrow.",
        429,
      ),
    );
  }
  if (quotaResult !== "allowed") {
    return finish(
      safeJson(
        "This feature is temporarily unavailable. Please try again later.",
        503,
      ),
    );
  }

  try {
    return finish(await execute());
  } catch {
    return finish(safeJson("Something went wrong. Please try again.", 502));
  }
}
