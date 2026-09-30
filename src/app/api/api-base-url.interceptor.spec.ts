import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  HttpInterceptorFn,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { apiBaseUrlInterceptor } from './api-base-url.interceptor';

/**
 * The interceptor reads `environment.apiBaseUrl`, and the environment file the
 * test builder imports is the local one — where that value is empty. So these
 * tests do two different jobs with two different subjects:
 *
 * - The real `apiBaseUrlInterceptor` is exercised as it will run in `ng serve`
 *   and in CI: base URL empty, URL must come out untouched. That is the case
 *   that keeps every other spec in the repo passing.
 * - A twin built by `withBaseUrl` exercises the production case. It is the same
 *   function with the environment lookup as a parameter, which is the only way
 *   to test the rewrite without a file replacement the test builder cannot do.
 *
 * The twin is a real risk and it is worth naming: it can drift from the
 * original. It is kept to four lines directly below, next to the import, so the
 * drift is visible in a diff instead of buried in another file.
 */
const withBaseUrl =
  (baseUrl: string): HttpInterceptorFn =>
  (req, next) => {
    const isApi = req.url === '/api' || req.url.startsWith('/api/');
    return isApi && baseUrl ? next(req.clone({ url: `${baseUrl}${req.url}` })) : next(req);
  };

const PROD_ORIGIN = 'https://tacotuesday-api.example.azurecontainerapps.io';

describe('apiBaseUrlInterceptor', () => {
  function setup(interceptor: HttpInterceptorFn) {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([interceptor])), provideHttpClientTesting()],
    });

    return {
      http: TestBed.inject(HttpClient),
      mock: TestBed.inject(HttpTestingController),
    };
  }

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    TestBed.resetTestingModule();
  });

  describe('with the real environment (local and test: empty base URL)', () => {
    it('leaves an /api URL relative, which is what proxy.conf.json needs', () => {
      const { http, mock } = setup(apiBaseUrlInterceptor);

      http.post('/api/leads', {}).subscribe();

      mock.expectOne('/api/leads').flush({});
    });

    it('leaves a non-API URL alone', () => {
      const { http, mock } = setup(apiBaseUrlInterceptor);

      http.get('/assets/config.json').subscribe();

      mock.expectOne('/assets/config.json').flush({});
    });
  });

  describe('with a production base URL', () => {
    it('prefixes an /api URL with the origin', () => {
      const { http, mock } = setup(withBaseUrl(PROD_ORIGIN));

      http.post('/api/leads', {}).subscribe();

      mock.expectOne(`${PROD_ORIGIN}/api/leads`).flush({});
    });

    it('prefixes /api exactly, not just anything starting with those letters', () => {
      const { http, mock } = setup(withBaseUrl(PROD_ORIGIN));

      http.get('/api').subscribe();
      // A path that merely begins with the same letters must NOT be sent to the
      // API. Without the `/api/` check this would become
      // `https://…/apidocs` and a request for a local page would leave the site.
      http.get('/apidocs').subscribe();

      mock.expectOne(`${PROD_ORIGIN}/api`).flush({});
      mock.expectOne('/apidocs').flush({});
    });

    it('does not touch a URL that is already absolute', () => {
      const { http, mock } = setup(withBaseUrl(PROD_ORIGIN));

      http.get('https://example.test/api/thing').subscribe();

      mock.expectOne('https://example.test/api/thing').flush({});
    });

    it('keeps the query string the service asked for', () => {
      const { http, mock } = setup(withBaseUrl(PROD_ORIGIN));

      http.get('/api/candidates/ping', { params: { name: 'Gio' } }).subscribe();

      const request = mock.expectOne((r) => r.url === `${PROD_ORIGIN}/api/candidates/ping`);
      expect(request.request.params.get('name')).toBe('Gio');
      request.flush({});
    });
  });
});
