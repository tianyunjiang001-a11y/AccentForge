import { createLocalJWKSet, jwtVerify, type JSONWebKeySet } from "jose";

import type { SecurityEnvironment } from "./types";

// Access is also enforced at the Pages edge. Verify its signed assertion here
// because a forwarded header alone is not proof of the caller's identity.
export async function verifyDiagnosticOwner(
  request: Request,
  env: SecurityEnvironment,
  fetcher: typeof fetch = (input, init) => globalThis.fetch(input, init),
): Promise<boolean> {
  const assertion = request.headers.get("cf-access-jwt-assertion");
  const audience = env.TURNSTILE_DIAGNOSTIC_ACCESS_AUD?.trim();
  const owner = env.TURNSTILE_DIAGNOSTIC_OWNER_EMAIL?.trim().toLowerCase();
  const teamOrigin = accessTeamOrigin(
    env.TURNSTILE_DIAGNOSTIC_ACCESS_TEAM_DOMAIN,
  );
  if (!assertion || !audience || !owner || !teamOrigin) return false;

  try {
    const response = await fetcher(`${teamOrigin}/cdn-cgi/access/certs`, {
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) return false;
    const jwks: unknown = await response.json();
    if (!isJwkSet(jwks)) return false;
    const { payload } = await jwtVerify(assertion, createLocalJWKSet(jwks), {
      algorithms: ["RS256"],
      issuer: teamOrigin,
      audience,
      requiredClaims: ["exp", "sub", "email"],
    });
    return (
      typeof payload.email === "string" &&
      payload.email.toLowerCase() === owner &&
      payload.type === "app" &&
      typeof payload.sub === "string" &&
      Boolean(payload.sub)
    );
  } catch {
    return false;
  }
}

function accessTeamOrigin(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      /^[a-z0-9-]+\.cloudflareaccess\.com$/.test(url.hostname) &&
      url.pathname === "/" &&
      !url.search &&
      !url.hash &&
      !url.username &&
      !url.password
      ? url.origin
      : null;
  } catch {
    return null;
  }
}

function isJwkSet(value: unknown): value is JSONWebKeySet {
  return (
    typeof value === "object" &&
    value !== null &&
    "keys" in value &&
    Array.isArray(value.keys) &&
    value.keys.length > 0 &&
    value.keys.length <= 20
  );
}
