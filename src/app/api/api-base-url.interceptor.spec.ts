import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  HttpInterceptorFn,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { apiBaseUrlInterceptor } from './api-base-url.interceptor';

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
