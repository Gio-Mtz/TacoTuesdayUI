import { HttpInterceptorFn } from '@angular/common/http';

import { environment } from '../../environments/environment';

/**
 * Turns the relative `/api/...` URLs the services ask for into absolute ones in
 * production, and leaves them alone everywhere else.
 *
 * ## Why an interceptor and not a prefix in each service
 *
 * `LeadsService` and `HealthService` both say, in their own comments, that their
 * URL is relative *on purpose* and that US-006 is what points it at the
 * Container App. This is that. Putting `${environment.apiBaseUrl}` inside each
 * service would spread one infrastructure fact across every service written from
 * now on, and the failure mode of forgetting it in the fifth service is a call
 * that works in `ng serve` (where the proxy hides it) and 404s in production.
 * Here it is one place, applied to every call, and impossible to forget.
 *
 * The trade is that reading `leads.service.ts` no longer tells you the whole
 * URL. That is the cost, it is written in `docs/adr/0004-api-base-url.md`, and
 * both services carry a comment pointing here.
 *
 * ## What it deliberately does not touch
 *
 * - **Anything that is not `/api`.** Assets, `index.html`, a future third-party
 *   call: all untouched. The check is `/api` exactly or `/api/…`, not
 *   `startsWith('/api')`, so a hypothetical `/apidocs` is not silently
 *   redirected at the API.
 * - **Absolute URLs.** They do not start with `/`, so they never match. A
 *   service that already knows its full URL keeps it.
 * - **Everything, when `apiBaseUrl` is empty.** In `ng serve` and in `ng test`
 *   the URL stays relative, `proxy.conf.json` keeps working, and
 *   `HttpTestingController` keeps matching on `/api/leads`. That is why none of
 *   the existing specs had to change.
 */
export const apiBaseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  const baseUrl = environment.apiBaseUrl;

  if (!baseUrl || !isApiUrl(req.url)) {
    return next(req);
  }

  // `clone` because an HttpRequest is immutable — mutating `req.url` is a no-op
  // that fails silently.
  return next(req.clone({ url: `${baseUrl}${req.url}` }));
};

/**
 * True for the API's own relative URLs and nothing else.
 *
 * Exact match on `/api` is included because `HttpClient.get('/api')` is legal
 * even though nothing calls it today; excluding it would be an arbitrary hole.
 */
function isApiUrl(url: string): boolean {
  return url === '/api' || url.startsWith('/api/');
}
