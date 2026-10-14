# AccentForge Phase 8B — Routing and deployment-safety preparation

**Status:** Local code preparation only. No Cloudflare deployment, GitHub push, resource creation or paid provider call.

## Prepared architecture

Browser requests remain same-origin at `/api/polish`, `/api/generate` and `/api/speech`. Cloudflare Pages uses the repository-root `functions/api/[[path]].ts` to pass the original request through production-only Service Binding `ACCENTFORGE_API` to the existing `accentforge-worker`. The Function rejects all other paths, methods, non-HTTPS production origins, preview hosts and missing/failed bindings. It never selects a provider or bypasses the Worker's Turnstile, rate-limit, quota and input checks. The Service Binding is **not yet configured**.

`frontend/public/_routes.json` is copied by Vite to `frontend/dist/_routes.json` and limits Function invocations to `/api/*`; static frontend assets remain normal Pages assets. The existing Vite development proxy still connects the local frontend directly to the local Worker and does not use this production-only Function.

The Worker deployment configuration explicitly sets `SECURITY_ENV=production`, `API_ENABLED=false`, `KIMI_ENABLED=false`, `MINIMAX_ENABLED=false`, `ALLOWED_ORIGINS=https://accentforge.pages.dev` and `TURNSTILE_ALLOWED_HOSTNAMES=accentforge.pages.dev`. The first deployment must keep these three switches false. The existing four rate-limit bindings, SQLite-backed `GlobalUsage` migration, request-count quotas and four-voice whitelist are unchanged. `workers_dev=false` remains; do not attach a public Worker route or custom domain.

## Build and Cloudflare dashboard preparation

For the Git-integrated Pages project `accentforge`, keep repository root as the root directory, production branch `main`, build command `pnpm --filter @accentforge/frontend build` and output directory `frontend/dist`. The root package declares `pnpm@11.19.0`, and the pnpm lockfile is present. In Pages build variables set `PNPM_VERSION=11.19.0` and `NODE_VERSION=22` (recommended). Keep `VITE_TURNSTILE_SITE_KEY` as the **public** sitekey for the real `accentforge.pages.dev` widget; scope production configuration carefully. Do not put any server secret in a `VITE_` variable or Pages build variable.

After the target Worker exists, in **Workers & Pages → accentforge → Settings → Bindings → Add → Service binding**, choose **Production**, variable name `ACCENTFORGE_API`, service `accentforge-worker`, save, then redeploy Pages for the binding to take effect. Do **not** add a Preview binding to the production paid Worker. Configure **Settings → Builds & deployments → Branch deployment controls** to disable automatic preview deployments or allow only deliberately selected branches before the next GitHub push. Review automatic production deployment behavior before pushing, because the connected repository may trigger a build on `main`. A Private GitHub repository does not make the deployed Pages site private.

The Worker must eventually receive `TURNSTILE_SITE_KEY` as a server-side non-secret variable and `TURNSTILE_SECRET_KEY`, `KIMI_API_KEY`, and `MINIMAX_API_KEY` as Worker Secrets. Existing non-secret provider configuration and four approved voice IDs remain in local/Worker configuration. No secret values belong in this report or in Git. Cloudflare's Wrangler configuration is the source of truth for non-secret Worker variables; dashboard changes may be overwritten by a subsequent Wrangler deployment. Confirm the three kill switches stay false after each deployment until a separate paid-API enablement approval.

## Safe first-deployment order — not executed

1. Review Pages build variables, production/preview scopes and auto-deployment controls; keep **Save and Deploy** unclicked until explicit deployment approval.
2. Approve and push this prepared local commit separately. A push is not part of Phase 8B.
3. Deploy `accentforge-worker` first with all three switches false, `workers_dev=false`, no public route, four rate-limit bindings and the existing SQLite migration. This creates Cloudflare resources only after separate approval.
4. Save and deploy Pages from the prepared `main` commit. Before the Service Binding exists, `/api/*` must fail closed with 503. Static UI can render, but paid actions must remain unavailable.
5. Add the **Production-only** `ACCENTFORGE_API` Service Binding and redeploy Pages. Check exact HTTPS host, method/path filtering, preview 403, Worker 503, and static asset routing without any paid call.
6. Only after separate approval, configure real Worker secrets and Turnstile settings, validate security on Cloudflare, provider budget dashboards and mainland reachability; explicitly decide whether and when to enable paid actions.

## Residual deployment risks and required validation

- **Client identity:** The Function passes the original `Request` directly and does not synthesize `CF-Connecting-IP` or trust `X-Forwarded-For`. Cloudflare documents that `CF-Connecting-IP` may differ in Worker subrequests. The exact Pages-to-Service-Binding behavior must be tested in the deployed environment before enabling paid routes. If individual client identity is not trustworthy, the existing per-IP rate limiter needs an approved design change; do not replace it with a client-supplied header.
- **Free CPU:** Workers Free currently limits HTTP invocations to 10 ms CPU. The MiniMax hex-to-MP3 decode is a plausible risk for long Part 2 audio; a real production CPU/error test is needed before public enablement. Network waiting time is not CPU time.
- **Costs:** Pages Function invocations count toward the Workers Free daily request allowance; `_routes.json` avoids charging static asset requests. SQLite-backed Durable Objects are supported on Workers Free, but actual migration, limits, billing and namespace configuration remain unverified until deployment. Existing daily Kimi/MiniMax limits reserve request counts, not guaranteed monetary spend.
- **Preview:** The hard-coded production HTTPS origin rejects preview URLs even if a preview binding is mistakenly supplied. Preview deployments must still receive no production Service Binding, Worker secrets or paid access. The production Turnstile widget should not be treated as preview isolation by itself.
- **Accessibility:** Cloudflare Pages, Workers and Turnstile require real mainland-China network testing. Do not bypass production checks to make a regional test succeed.

## Local QA

The focused Pages Function suite covered the three forwarded routes, original Request/response preservation, query/body/Origin/header preservation, preflight forwarding, path/method denial, wrong/preview/HTTP host denial, missing/failing binding, and disabled Worker routes. Deployment-configuration tests checked the narrow `_routes.json`, explicit disabled production switches, exact origin/hostname, Worker name, four rate-limit bindings, SQLite migration and pnpm workspace declaration. Existing Worker and frontend tests were rerun. Wrangler successfully compiled the Pages Function locally, and the frontend build copied `_routes.json` into `frontend/dist`.

The existing local `worker/.dev.vars` workflow was checked without reading or printing secret values: a deliberately malformed local Polish POST returned HTTP 400 rather than the production-disabled 503. This shows the explicit local settings still override the deployment defaults. That malformed request stopped before Turnstile or any paid provider. The temporary local Worker was stopped afterward.

Final local check results: Prettier, TypeScript (frontend, Worker and Pages Function), ESLint, `git diff --check`, frontend production build, Worker dry-run build, and Pages Functions compilation all passed. The full test run passed **124 Worker tests**, including **17 Pages forwarding tests**, **16 frontend tests**, and **3 deployment-configuration tests**. The built `frontend/dist/_routes.json` contained only `/api/*` in its include list. Wrangler dry-run displayed all three production switches as `false`, the exact production origin/hostname, four rate-limit bindings and the existing `GlobalUsage` binding; it did not deploy.

No live Pages deployment, Service Binding, Cloudflare runtime metadata, Kimi or MiniMax API call was tested. Production acceptance still requires a controlled Cloudflare smoke test with paid routes disabled.

Official references: [Pages Functions routing](https://developers.cloudflare.com/pages/functions/routing/), [Pages Service Bindings](https://developers.cloudflare.com/pages/functions/bindings/), [Pages build image](https://developers.cloudflare.com/pages/configuration/build-image/), [Workers Service Bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/), [Worker CPU limits](https://developers.cloudflare.com/workers/platform/limits/), [Cloudflare IP headers](https://developers.cloudflare.com/fundamentals/reference/http-headers/).
