# ADR 0004 — How the UI finds the API in production

- **Status:** accepted
- **Date:** 2026-09-29
- **Story:** US-006 (wire UI and API in production: environments + CORS)
- **Supersedes nothing. Constrains:** every service that talks to the API from now on.

## Context

Up to US-005 every call the UI makes is a **relative** URL — `/api/leads`,
`/api/candidates/ping`. That works in two situations and neither of them is
production:

- `ng serve`, because `proxy.conf.json` forwards `/api` to `localhost:5001`.
- `ng test`, because `HttpTestingController` never opens a socket.

In production the two halves live on different origins:

| Half | Origin |
| --- | --- |
| UI (Azure Static Web Apps) | `https://kind-coast-0c494471e.3.azurestaticapps.net` |
| API (Azure Container Apps) | `https://tacotuesday-api.delightfultree-708c7167.southcentralus.azurecontainerapps.io` |

A relative `/api/leads` from the first origin asks the **Static Web App** for
`/api/leads`. SWA has a `navigationFallback` rewrite to `/index.html`, so the
browser gets **HTML with a 200** instead of a 404. The form then fails while
parsing JSON, and the visitor is told "no pudimos conectar" — an error that
points at the API when the API was never called. That misleading symptom is the
reason this decision is written down rather than just made.

Azure Static Web Apps cannot be made to proxy this away: a `staticwebapp.config.json`
`rewrite` has to be a site-relative path, and "linked backends" are a different
feature with its own plan requirements. So the UI has to name the API's origin,
and naming it means the call is cross-origin, which means CORS.

## Decision

**1. The origin comes from an environment file, replaced at build time.**

`src/environments/environment.ts` holds `apiBaseUrl: ''`.
`src/environments/environment.production.ts` holds the Container App's FQDN.
`angular.json`'s `production` configuration swaps them with `fileReplacements`.

**2. The default file is the LOCAL one, not production.**

This is the opposite of what `ng generate environments` scaffolds, and it is
deliberate. The `test` builder has **no configuration**, so whatever
`environment.ts` contains is what the test suite imports. With production as the
default, one spec that forgot `provideHttpClientTesting()` would POST at the live
API from CI. With local as the default the same mistake dies on a relative URL
and nothing leaves the machine.

The cost is the mirror-image failure — shipping production with the replacement
unwired, which puts us back to calling SWA's own origin. That is paid for
directly:

- `src/environments/environment.spec.ts` asserts the production file really holds
  an absolute `https://` origin with no trailing slash, and that it is not the
  Central US host OPS-5 destroyed.
- The wiring itself has no test, because the test builder cannot perform a file
  replacement. It has **evidence**: the block that changes it greps the emitted
  bundle for the FQDN, in both directions (present in `ng build`, absent in
  `ng build --configuration development`), and pastes the result in the work log.

**3. The prefix is applied by an interceptor, not by each service.**

`src/app/api/api-base-url.interceptor.ts` rewrites a URL that is exactly `/api`
or starts with `/api/` to `${environment.apiBaseUrl}${url}`. Registered once in
`app.config.ts`.

## Alternatives considered

**A prefix inside each service** (`${environment.apiBaseUrl}/api/leads`).
Rejected: it spreads one infrastructure fact across every service written from
here on, and the failure mode of forgetting it in the fifth service is a call
that works in `ng serve` — where the proxy hides the omission — and 404s in
production. The bug would be introduced and shipped without ever failing locally.

**An `API_BASE_URL` injection token consumed by each service.** Same objection,
one indirection deeper.

**Keeping relative URLs and proxying at the edge.** Ruled out above: SWA rewrites
cannot target an external origin.

## Consequences

**Accepted cost: reading `leads.service.ts` no longer tells you the whole URL.**
That is a real loss and the mitigation is only comments — one in each service
pointing here, plus this ADR. If a third mechanism ever competes to rewrite URLs,
delete one of them; two interceptors both editing a URL is not debuggable.

**The CORS half is not ours and not testable from here.** The Container App needs
`Cors__AllowedOrigins__0` = the Static Web App origin. The API's policy is
`WithOrigins(configured).AllowAnyHeader().AllowAnyMethod()`, so once the origin is
listed the `Content-Type: application/json` preflight on `POST /api/leads`
passes. Until it is listed, the API answers correctly and the **browser** discards
the response — from the UI it is indistinguishable from an outage. No build and no
test in this repo can see that. `GET /health` on the deployed site is the cheapest
probe: same interceptor, same CORS policy, nothing to fill in.

**`Retry-After` is not readable cross-origin.** It is not a CORS-safelisted
response header, so on a 429 the UI cannot read it without the API adding
`.WithExposedHeaders("Retry-After")`. Today nothing reads it — the copy says
"Espera un minuto" as a constant — so this costs nothing. It is written here so
that whoever first tries to show a real countdown knows why the header is
`null` instead of assuming the API stopped sending it.

**The FQDN is infrastructure and it has already changed once.** OPS-5 moved the
Container Apps environment from Central US to South Central US to sit beside the
SQL server, and the old `ambitiousmeadow-…centralus…` host stopped existing.
Recreating the *environment* changes this value again. That is why a wrong FQDN
has a test naming the dead region, and why `environment.production.ts` carries the
`az containerapp show … ingress.fqdn` query in a comment: the next person to hit
this should check the value before suspecting the code.
