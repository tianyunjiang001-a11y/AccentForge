# AccentForge Phase 7 — Production Protection QA

**Date:** 2026-10-12 (Asia/Shanghai)  
**Status:** Code implemented and locally tested; Cloudflare production configuration and validation pending. No deployment performed.

## 1. Threats addressed and route order

All three paid routes independently run: server-owned API switch → production security-configuration check → method, exact Origin, JSON media type, bounded UTF-8 body and route input validation → route and combined rate-limit bindings → Cloudflare Turnstile Siteverify → shared daily request reservation → existing Kimi/MiniMax service. A rejection stops before paid-provider transport. `GET /health` is non-paid. Browser-only button disabling is not treated as a cost control.

The principal threats are anonymous scripted calls, accidental repeat clicks, malformed or oversized payloads, replayed/invalid Turnstile tokens, cross-endpoint bursts, unexpectedly high owner-funded usage, unavailable security dependencies, and leakage of upstream errors or learner content. No account, learner database, history, payment or new public product feature was added.

## 2. Implemented controls and Cloudflare components

- **Turnstile:** explicit, on-demand widgets for Polish, Generate and Read Aloud; a fresh token is requested for each click. The Worker POSTs each token to official Siteverify, checks `success`, expected action and configured hostname, and rejects missing, invalid, expired or replayed tokens. Siteverify is the authoritative single-use check. The public sitekey is never treated as a credential; the secret stays in Worker configuration.
- **Workers Rate Limiting Bindings:** four independently configured bindings, keyed on Cloudflare's `CF-Connecting-IP` (not `X-Forwarded-For`), with a conservative shared-IP trade-off. Binding failure rejects the request. Cloudflare documents these counters as local to a Cloudflare location and approximate, not globally exact.
- **SQLite-backed Durable Object:** one binding/ID coordinates atomic daily reservations using one SQLite upsert. It stores only UTC day, provider (`kimi` or `minimax`) and request count. Older days are deleted. Provider failure does **not** refund the reservation because a request may already have been billed. Unavailable coordination fails closed. This is a security counter, not a learner database.
- **HTTP controls:** exact configured CORS origins (no wildcard), POST-only paid routes, JSON media type, bounded body reads, `Cache-Control: no-store, private`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, and normalized JSON errors. CORS is not claimed as authentication. `workers_dev=false` avoids an unintended public workers.dev route when Phase 8 eventually deploys.
- **Provider reliability:** 45-second Kimi and 120-second MiniMax abort deadlines; bounded upstream response reads; explicit upstream-429 normalization; MP3 signature verification; no automatic retry of ambiguous chargeable synthesis. Existing frontend in-flight guards, stale-state checks and Blob URL cleanup remain.

## 3. Initial protective thresholds

| Control               | Default | Window / scope                              | Location                      |
| --------------------- | ------: | ------------------------------------------- | ----------------------------- |
| Polish                |      20 | per IP, 60 seconds, per Cloudflare location | `worker/wrangler.toml`        |
| Generate              |      20 | per IP, 60 seconds, per Cloudflare location | `worker/wrangler.toml`        |
| Speech                |       8 | per IP, 60 seconds, per Cloudflare location | `worker/wrangler.toml`        |
| Combined paid actions |      32 | per IP, 60 seconds, per Cloudflare location | `worker/wrangler.toml`        |
| Kimi                  |     150 | total reservations per UTC day              | `KIMI_DAILY_REQUEST_LIMIT`    |
| MiniMax               |      40 | total reservations per UTC day              | `MINIMAX_DAILY_REQUEST_LIMIT` |

These are initial engineering defaults, **not** owner-approved commercial limits or a guaranteed RMB ceiling. The 4,000-Unicode-character speech-text ceiling accommodates an information-rich two-minute Part 2 answer while narrowing the previous 9,999-character cost exposure. Raw Chinese remains at 1,000 Unicode characters. Worker body ceilings are 8,192 bytes for each text route and 24,000 bytes for speech, including the Turnstile token. Tune thresholds after legitimate classroom testing; a school sharing one public IP may experience false positives.

## 4. Cost and operational limitations

The owner remains responsible for both Kimi and MiniMax dashboard balance, billing alerts, budget settings, and disabling auto-recharge before launch. Request counts do not capture token usage, synthesis characters, retries inside a provider, price changes or exact spend. The MiniMax daily limit is lower because speech is likely the higher variable-cost action. An attacker can still use many IPs or valid Turnstile challenges, exhaust the shared quota, or cause owner cost up to the request limits. The quota is a request-count ceiling for this Worker binding, not a financial guarantee or a cross-account spending limit.

Emergency switches are server-owned: `API_ENABLED=false` disables all paid routes; `KIMI_ENABLED=false` disables Polish and Generate; `MINIMAX_ENABLED=false` disables Speech. Only `true` or unset enables a switch; any other value fails closed. Changing a deployed switch is an owner/Cloudflare configuration action, never a browser request. No automatic credit purchase was added.

Cloudflare [Durable Objects pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/) includes request, active-duration and SQLite storage dimensions, with account-plan allowances and possible overages. This phase only added local/configured bindings; it did not provision or activate paid cloud resources. Phase 8 must confirm the actual account plan and expected DO/Worker cost before deployment.

## 5. Turnstile local behavior and fail-closed policy

The local frontend uses Cloudflare's official **test** sitekey only in Vite development when no sitekey is set. The separate local Wrangler fixture uses only Cloudflare's official test sitekey and test secret and deliberately has no Kimi/MiniMax configuration. The live official test Siteverify response observed locally reported `hostname: example.com` with no action; a narrowly scoped exception accepts exactly that documented-test-key response only when `SECURITY_ENV=development` **and** the Worker request host is localhost/127.0.0.1. A local test response with `hostname: localhost`, `action: test` is also accepted. Production requires exact configured hostname and route action, rejects all official test keys, and cannot activate local mode merely through a browser header/query parameter. Missing production sitekey, secret, exact origins/hostnames, any binding or the shared quota binding fails closed.

Official references: [Turnstile widget](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/widget-configurations/), [Siteverify](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/), [test keys](https://developers.cloudflare.com/turnstile/troubleshooting/testing/), [rate-limit bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/), [SQLite Durable Object storage](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/).

If Turnstile script loading or Siteverify fails, the learner sees a restrained security error and no provider request occurs. The security challenge may affect China Mainland accessibility; it must be tested on real mainland networks in Phase 8/9, with no insecure bypass.

## 6. Secret and privacy handling

The existing `worker/.dev.vars` remains ignored by Git and was neither printed nor committed. Only the official local Turnstile test configuration and server-owned switches were appended; existing Kimi/MiniMax settings were preserved and their values were not inspected. The new `.env.example` contains placeholders and public official test keys only. Production `KIMI_API_KEY`, `MINIMAX_API_KEY` and `TURNSTILE_SECRET_KEY` must be Cloudflare Worker Secrets. The frontend receives only `VITE_TURNSTILE_SITE_KEY`; no private key or provider URL/model is returned to it. Runtime code does not log API keys, full student text, prompts, generated answers, audio, IP addresses or raw provider responses. Cloudflare platform request logs and retention settings still require owner review.

## 7. Local security tests and results

- Unit/integration tests use mocked Kimi and MiniMax transport, never paid credentials. They cover missing/invalid/replayed/expired Turnstile tokens, hostname/action mismatch, successful verification, absent production configuration/test-key rejection, invalid JSON/content type/oversized body, Part/Band and unsupported voice rejection, per-route and combined rate checks, shared quota exhaustion/unavailability, all three kill switches, upstream Kimi 429, MiniMax failure, provider timeouts, duplicate submission, stale English, audio cleanup, and no provider call after security rejection.
- Full Worker-route integration with mocked transport returned normalized Chinese, English and MP3 for legitimate secured requests. Failed Siteverify generated one Siteverify call and **zero** paid-provider calls.
- A separate local Wrangler process (`tests/phase7/wrangler.local.toml`) bound the actual local rate-limit primitives and SQLite Durable Object with no paid provider settings. `GET /health` returned 200; a missing token returned 403. With an official dummy token, the first valid Polish request passed Siteverify and quota then returned expected 502 because Kimi was intentionally unconfigured. The second returned 429 daily quota exhausted. This confirms the local Durable Object reservation path; no Kimi or MiniMax request was made. The local process was stopped afterward.
- No real Kimi or MiniMax requests were made in Phase 7. One free official Siteverify verification was made directly to diagnose the test-response shape; the local Worker also made only test Siteverify calls.

## 8. Main regression checks

Final local checks passed: `pnpm format:check`, `pnpm typecheck`, `pnpm lint`, `pnpm test` (107 Worker tests and 16 frontend tests), `pnpm --filter @accentforge/frontend build`, and `pnpm --filter @accentforge/worker build` (dry-run only). Existing Kimi/English prompt files, Speaking Style Guide, pedagogical rules, approved four voice IDs, MiniMax model/speed and approved main layout were not edited. The only frontend addition is an on-demand, interaction-only Turnstile slot next to each existing action. Headless Chrome screenshots at desktop width 1,440 px and narrow width 500 px were inspected locally; the initial interface retained its existing layout and showed no security widget before action. Screenshots were kept outside Git. A production-domain visual and playback check is still required; no paid synthesis was performed.

## 9. Phase 8 manual setup and production validation — not done

1. Confirm Cloudflare account plan, Workers/Pages/SQLite DO availability and projected costs; do **not** assume local bindings prove production configuration.
2. Register a real Turnstile widget restricted to the intended production hostname(s). Add its public sitekey as a frontend build variable and Worker variable; store its real secret as a Worker Secret. Never use official test keys in production.
3. Set exact HTTPS `ALLOWED_ORIGINS` and `TURNSTILE_ALLOWED_HOSTNAMES`. Review CORS, direct Worker exposure and real routing between Cloudflare Pages and Worker. Do not use wildcard CORS.
4. Configure/verify four Worker rate-limit bindings and the SQLite Durable Object migration/binding. Review threshold suitability for shared school networks and adjust request limits in `wrangler.toml`/Worker configuration if approved.
5. Set provider credentials as Worker Secrets, verify separate Kimi and MiniMax dashboard balance/budget alerts, disable auto-recharge, and rehearse `API_ENABLED`, `KIMI_ENABLED`, `MINIMAX_ENABLED` emergency disable actions.
6. Validate Siteverify success, expiry/replay, action/hostname rejection, rate limiting, global quota and kill switches in the actual Cloudflare environment before opening the service. Use a controlled, low-cost provider smoke test only with owner approval.
7. Test Pages, Workers and Turnstile reachability and challenge completion from mainland China; revisit rollout if accessibility fails rather than weakening production security.

## 10. Residual gaps / vulnerabilities

- No account identity exists; IP-based rate limiting can penalize legitimate shared-network learners and can be bypassed by rotating IPs. Cloudflare rate-limit bindings are not globally exact counters; only the Durable Object coordinates the daily request reservation.
- Daily quota is a request count, not a currency ceiling. Requests that fail after reservation still consume one slot. It limits concurrency safely but may cause availability loss under attacks or upstream outages.
- No production Cloudflare resources, real Turnstile widget, custom domain, provider smoke test, mainland accessibility test, dashboard budget configuration or production-domain browser screenshot was performed in Phase 7. Thus this is **code-ready for Phase 8 preparation, not security-verified in a deployed Cloudflare environment**.
- Cloudflare challenge behavior, bot protection effectiveness, regional reachability, platform billing and exact production rate-limit semantics need deployment-stage validation.
