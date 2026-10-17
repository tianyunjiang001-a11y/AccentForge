# Phase 8G-D4A — Temporary Turnstile diagnostic (local preparation)

Status: historical implementation record. The temporary tool has been removed
from the current local source. This cleanup has **not** been pushed or deployed;
no production configuration or Secret has been removed. The implementation and
activation instructions below describe the retired tool, not a deployment plan.

## Local removal and smallest release plan

Removed the temporary frontend view, Worker endpoint, Pages allowlist entry,
Access JWT verifier and its `jose` dependency, dedicated tests, environment types,
ordinary diagnostic variables and fifth rate-limit binding. Under the owner's
subsequent usable-website decision, Turnstile is also temporarily removed from
the normal request path. Four business rate limits, bounded requests, exact
Origins, shared daily quotas and all three emergency switches remain enforced.

After separate approval:

1. Record the current Pages deployment and disabled Worker version as rollback
   targets. Keep Access in place and all three paid switches `false`.
2. Deploy the cleaned Worker and Pages Function/frontend using the existing
   manual deployment workflow. Preserve the three production provider/Turnstile
   Secrets, `ACCENTFORGE_API`, four normal rate limits and `GLOBAL_USAGE`. Remove
   only the retired ordinary diagnostic variables/binding. Delete encrypted
   `TURNSTILE_DIAGNOSTIC_OWNER_EMAIL` only after the deployment is stable and
   rollback is no longer needed. Do not bypass a strict configuration conflict.
3. Verify the removed API returns 404, the old view no longer renders a diagnostic
   interface, and normal paid routes return the Worker's disabled 503. The old
   view URL can fall back to the ordinary App because Pages serves an SPA.
4. With separate paid-test approval and Access still owner-only, temporarily
   enable the required providers and perform exactly one real website
   Polish → Generate → Audio workflow with no automatic retries. Restore all
   switches to `false` after the test. Only a successful complete workflow allows
   requesting approval for public access with paid functionality and the same
   4/2 quotas. Do not publish a static-only substitute. GitHub Public visibility
   separately requires a complete historical credential check and owner approval.

If deployment regresses, restore the recorded Pages deployment and disabled
Worker version, keep paid switches `false`, and retain/reinstate owner-only Access.
Delay deletion of the diagnostic owner Secret until rollback is no longer needed;
Worker version rollback does not restore a deleted Secret.

## Historical implementation

This tool isolates the production Turnstile check from Kimi, MiniMax and the
`GlobalUsage` paid-request quota. It is not a new learner feature. The normal
`/api/polish`, `/api/generate` and `/api/speech` routes keep their existing
security and user-facing responses.

## Isolated flow

An unlinked `/__turnstile-check` view uses the same `useTurnstileAction("polish")`
hook and configured production widget as the learner action. It submits only a
fresh `turnstileToken` to `POST /api/turnstile-diagnostic`. The existing
repository-root Pages Function forwards that exact route to `accentforge-worker`
through `ACCENTFORGE_API`; `_routes.json` remains limited to `/api/*`. Preview
hosts are rejected by the Function and the Worker. Cloudflare Pages' SPA
fallback serves the unlinked view from the existing `index.html`.

The Worker endpoint is disabled by default. It requires **all** of:

- exact `https://accentforge.pages.dev` request URL and `Origin`;
- `SECURITY_ENV=production` and exact production Origin/Turnstile hostname
  configuration, with real rather than official test widget credentials;
- `TURNSTILE_DIAGNOSTIC_ENABLED=true` and a server-owned UTC expiry no more
  than 15 minutes away;
- `API_ENABLED=false`, `KIMI_ENABLED=false`, `MINIMAX_ENABLED=false`;
- a signed, unexpired Cloudflare Access **application** JWT with the configured
  issuer and audience and an email claim matching the server-only owner value;
- the dedicated `TURNSTILE_DIAGNOSTIC_RATE_LIMIT` binding, configured for one
  request per 60 seconds, which must allow the attempt;
- a valid POST/JSON body containing a nonempty token of at most 2,048 characters.

It then invokes `verifyTurnstileDetailed`, the same validator used by the paid
routes' `verifyTurnstile` wrapper. Only an authenticated owner receives a safe
category: `before_siteverify` (including `token_missing` and
`token_too_long`), `siteverify_transport_failure`,
`siteverify_http_failure`, `siteverify_rejected` (allowlisted reason
`invalid_secret`, `invalid_response`, `expired_or_replayed`, or `other`),
`hostname_mismatch`, `action_mismatch`, or `verified`. Raw Siteverify JSON and
all token, Secret, Access, learner, and IP values stay out of results and logs.
An `invalid_secret` reason identifies an invalid/expired Secret; a valid Secret
belonging to the wrong widget may instead yield `invalid_response`, so that
result alone cannot prove the precise pairing error.

The diagnostic has no import or call path to Kimi, MiniMax or `GlobalUsage`.
No paid switch is enabled to run it. Cloudflare's rate-limit binding is
per-location and is not a globally exact counter; owner-only Access, the
single-use interface and short server-side expiry further constrain exposure.

## D4B deployment prerequisites — separate approval required

1. Recheck the clean approved commit, Private repository, manual Pages
   deployment setting, owner-only Access application and preview isolation.
2. Configure these **ordinary Worker variables** in the deployment plan:
   `TURNSTILE_DIAGNOSTIC_ACCESS_TEAM_DOMAIN` as the exact HTTPS
   `https://<team>.cloudflareaccess.com` origin,
   `TURNSTILE_DIAGNOSTIC_ACCESS_AUD` as the existing Access application's AUD,
   and `TURNSTILE_DIAGNOSTIC_EXPIRES_AT` as a UTC ISO timestamp within 15
   minutes of the intended test. Do not put owner identity in Git.
3. Configure `TURNSTILE_DIAGNOSTIC_OWNER_EMAIL` only as an encrypted Worker
   Secret using the Cloudflare dashboard or official secret command, without
   disclosing it in chat or command output. Verify existing three production
   Secrets are preserved. The owner identity value is required even though
   Access is already configured owner-only.
4. Deploy the Worker and Pages code **with**
   `TURNSTILE_DIAGNOSTIC_ENABLED=false`; verify the diagnostic route returns
   generic 404, three paid switches remain false, `workers.dev`/Preview URLs
   remain off, the new binding is present, and the Production Pages Service
   Binding still targets this Worker. Verify Access covers the temporary view
   and the API path. Do not give preview deployments the production binding.
5. Only after those checks, separately authorize a short diagnostic window:
   set the server-owned diagnostic flag to exactly `true` while preserving all
   ordinary variables and encrypted Secrets. Verify the active Worker version
   and the Access assertion forwarding. One owner-authenticated click in the
   temporary view sends one fresh token. Never paste the JWT, cookie, token or
   Siteverify response into chat or logs. Close the window by setting the
   diagnostic flag to `false` and verifying the running version; expiry is a
   backup, not the shutdown procedure.

Cloudflare Access' `Cf-Access-Jwt-Assertion` forwarding through the existing
Pages Service Binding must be verified during D4B. If absent, the endpoint
fails closed and must **not** be weakened to trust a client identity header.
Do not interpret `verified` as proof that Kimi generation works; it proves the
shared Turnstile validator accepts the real production widget token without
spending Kimi credits.

## Complete removal after diagnosis

1. Disable the diagnostic flag and verify the running Worker first.
2. Remove the unlinked view, main-entry conditional, Pages Function allowlist
   entry, Worker route, diagnostic handler and Access verifier, dedicated rate
   binding, diagnostic environment names and `jose` dependency if unused.
3. Remove the encrypted diagnostic owner Secret and temporary ordinary
   diagnostic variables from Cloudflare after the disabled state is verified.
4. Run all checks, commit the removal, then separately approve Worker and
   Pages redeployments. Confirm `/api/turnstile-diagnostic` is 404 and
   `/__turnstile-check` no longer renders the test view. Keep the permanent
   safe Siteverify error classification only if separately approved; otherwise
   restore the original minimal logging behavior as part of removal.

Official references: [Turnstile Siteverify](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/),
[Access JWT validation](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/),
[Pages SPA serving](https://developers.cloudflare.com/pages/configuration/serving-pages/),
[Pages Function routing](https://developers.cloudflare.com/pages/functions/routing/),
[Workers rate-limit binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/).
