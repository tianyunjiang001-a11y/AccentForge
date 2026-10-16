import { beforeAll, describe, expect, it, vi } from "vitest";
import { exportJWK, generateKeyPair, SignJWT } from "jose";

import { verifyDiagnosticOwner } from "./diagnostic-access";
import type { SecurityEnvironment } from "./types";

const issuer = "https://example-team.cloudflareaccess.com";
const audience = "example-application-audience";
const owner = "owner@example.invalid";
const env: SecurityEnvironment = {
  TURNSTILE_DIAGNOSTIC_ACCESS_TEAM_DOMAIN: issuer,
  TURNSTILE_DIAGNOSTIC_ACCESS_AUD: audience,
  TURNSTILE_DIAGNOSTIC_OWNER_EMAIL: owner,
};

let signingKey: CryptoKey;
let jwks: { keys: object[] };

beforeAll(async () => {
  const keys = await generateKeyPair("RS256", { extractable: true });
  signingKey = keys.privateKey;
  jwks = { keys: [{ ...(await exportJWK(keys.publicKey)), kid: "test-key" }] };
});

async function token(
  options: {
    key?: CryptoKey;
    email?: string;
    aud?: string;
    iss?: string;
    expiry?: number;
  } = {},
) {
  return new SignJWT({ email: options.email ?? owner, type: "app" })
    .setProtectedHeader({ alg: "RS256", kid: "test-key" })
    .setIssuer(options.iss ?? issuer)
    .setAudience(options.aud ?? audience)
    .setSubject("example-owner-subject")
    .setExpirationTime(options.expiry ?? Math.floor(Date.now() / 1_000) + 60)
    .sign(options.key ?? signingKey);
}

function request(assertion?: string) {
  return new Request("https://accentforge.pages.dev/api/turnstile-diagnostic", {
    headers: assertion ? { "cf-access-jwt-assertion": assertion } : {},
  });
}

function jwksFetch() {
  return vi.fn<typeof fetch>().mockResolvedValue(Response.json(jwks));
}

describe("owner-only Access JWT verification", () => {
  it("checks a real RS256 signature, issuer, audience, expiry and owner", async () => {
    const fetcher = jwksFetch();
    expect(
      await verifyDiagnosticOwner(request(await token()), env, fetcher),
    ).toBe(true);
    expect(fetcher).toHaveBeenCalledExactlyOnceWith(
      `${issuer}/cdn-cgi/access/certs`,
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("rejects missing and forged JWTs", async () => {
    const fetcher = jwksFetch();
    expect(await verifyDiagnosticOwner(request(), env, fetcher)).toBe(false);
    expect(fetcher).not.toHaveBeenCalled();
    const attacker = await generateKeyPair("RS256");
    expect(
      await verifyDiagnosticOwner(
        request(await token({ key: attacker.privateKey })),
        env,
        fetcher,
      ),
    ).toBe(false);
  });

  it("rejects expired, wrong-audience, wrong-issuer and non-owner JWTs", async () => {
    const fetcher = jwksFetch();
    for (const options of [
      { expiry: Math.floor(Date.now() / 1_000) - 60 },
      { aud: "another-application" },
      { iss: "https://other.cloudflareaccess.com" },
      { email: "another@example.invalid" },
    ]) {
      expect(
        await verifyDiagnosticOwner(
          request(await token(options)),
          env,
          fetcher,
        ),
      ).toBe(false);
    }
  });

  it("fails closed for missing owner configuration, invalid team domain or JWKS failure", async () => {
    const signed = request(await token());
    expect(
      await verifyDiagnosticOwner(
        signed,
        { ...env, TURNSTILE_DIAGNOSTIC_OWNER_EMAIL: undefined },
        jwksFetch(),
      ),
    ).toBe(false);
    expect(
      await verifyDiagnosticOwner(
        signed,
        {
          ...env,
          TURNSTILE_DIAGNOSTIC_ACCESS_TEAM_DOMAIN: "https://evil.example",
        },
        jwksFetch(),
      ),
    ).toBe(false);
    expect(
      await verifyDiagnosticOwner(
        signed,
        env,
        vi.fn<typeof fetch>().mockRejectedValue(new Error("offline")),
      ),
    ).toBe(false);
  });
});
