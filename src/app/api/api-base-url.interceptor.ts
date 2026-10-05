import { HttpInterceptorFn } from '@angular/common/http';

import { environment } from '../../environments/environment';

export const apiBaseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  const baseUrl = environment.apiBaseUrl;

  if (!baseUrl || !isApiUrl(req.url)) {
    return next(req);
  }

  return next(req.clone({ url: `${baseUrl}${req.url}` }));
};

function isApiUrl(url: string): boolean {
  return url === '/api' || url.startsWith('/api/');
}
