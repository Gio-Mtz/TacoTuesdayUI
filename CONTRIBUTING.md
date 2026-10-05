# Contributing — Taco Tuesday UI

The backend lives in [TacoTuesdayApi](https://github.com/Gio-Mtz/TacoTuesdayApi). **Full setup
for both repositories is in that one**, at `docs/onboarding.md`. Start there.

This file covers what is specific to the Angular app.

---

## Running it

```bash
npm ci        # not `npm install` — ci installs exactly what the lock file says
npm start     # http://localhost:4200
```

The API has to be running too, or every request 500s. See the API's onboarding.

## How it talks to the API

**In development** the Angular dev server proxies `/api` to the API — see `proxy.conf.json`.
The browser only ever sees one origin, so there is no CORS.

**In production** there is no proxy: the app is static files on a CDN and there is no Node in
the middle. The UI calls the API's real URL and CORS is real. That is why `environment.ts` has
an `apiBaseUrl` that is empty in development and a full URL in production.

If you find yourself hardcoding `https://localhost:7001` anywhere, stop — that is the bug this
setup exists to prevent.

## Conventions

| | |
| --- | --- |
| Components | Standalone. No NgModules |
| State | Signals. `toSignal()` to bridge anything from RxJS |
| Change detection | Zoneless. **Mutating a plain property will not re-render** |
| Styling | The design tokens in `src/styles`. Never a raw hex in a component |
| Routing | Lazy `loadComponent` per feature |

### The zoneless rule is the one that bites

There is no `zone.js`. Angular re-renders because a **signal** the template read changed —
nothing patches `setTimeout` or the HTTP response any more.

```ts
// ❌ silently does nothing on screen
this.data = response;

// ✅
this.data.set(response);
```

### Colours come from tokens

```scss
.card {
  background: var(--tt-bg-surface);   // ✅ follows light/dark
  background: #ffffff;                // ❌ stays white in dark mode
  color: tt.agave(600);               // ❌ Sass resolves at build time, cannot change at runtime
}
```

Sass for things that never change (spacing, breakpoints, mixins). CSS custom properties for
anything that does (the theme).

## Tests

Angular 22 uses **Vitest**, not Karma. It runs in Node — no browser needed.

```bash
npx ng test --watch=false     # what CI runs
npx ng test                   # watch mode while you work
```

Mock HTTP with `provideHttpClientTesting` and assert on the request. A component test that
makes a real network call is a flaky test, and it is how the first two specs in this repo were
broken for a week.

## Branches, pull requests, Definition of Done

Identical to the API repository — see its `CONTRIBUTING.md`. Same branch naming, same
template, same bar.

One difference worth stating: **frontend changes are built and tested before they are
proposed.** The tooling here runs anywhere. There is no "I could not compile it" excuse on
this side, and pull requests should not contain one.
