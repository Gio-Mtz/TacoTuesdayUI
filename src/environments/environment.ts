/**
 * Local and test configuration. This is the file every build gets unless a
 * configuration replaces it, and that default is deliberate — see below.
 *
 * `ng build --configuration production` swaps this file for
 * `environment.production.ts` through `fileReplacements` in `angular.json`.
 * `ng serve` (development) and `ng test` (no configuration at all) both get
 * THIS file.
 *
 * Why the default is local and not production: the test builder has no
 * configuration to hook a replacement onto, so whatever lives here is what the
 * test suite imports. With production as the default, a single test that used
 * the real `HttpClient` backend instead of `provideHttpClientTesting()` would
 * quietly POST at the live API from CI. With local as the default the same
 * mistake fails at the door with a relative URL and nothing leaves the machine.
 *
 * The cost of this choice is the opposite mistake — shipping a production build
 * with the replacement unwired, which would leave the landing calling `/api`
 * on the Static Web App's own origin and getting `index.html` back. That is
 * covered two ways: `environment.spec.ts` asserts the production file really
 * holds an absolute origin, and the block that wires this greps the emitted
 * bundle for the FQDN. Argued in `docs/adr/0004-api-base-url.md`.
 */
export const environment = {
  production: false,

  /**
   * Prefix the `apiBaseUrl` interceptor puts in front of every `/api` call.
   *
   * Empty on purpose. An empty prefix leaves the URL relative, which is exactly
   * what `proxy.conf.json` needs: the dev server forwards `/api` to
   * `localhost:5001`, so the browser never makes a cross-origin call and CORS
   * never enters the picture while developing.
   */
  apiBaseUrl: '',

  /**
   * Origin used to build absolute `og:url` / `canonical` values while
   * developing. It is the dev server's own origin, which keeps the tags
   * inspectable in devtools without pointing a local page at production — a
   * `canonical` that says "the real page is over there" is exactly what you do
   * NOT want while you are looking at a draft.
   */
  siteBaseUrl: 'http://localhost:4200',
} as const;
