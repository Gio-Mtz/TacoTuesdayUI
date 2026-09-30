import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IPingResponse } from './IPingResponse';

/**
 * The `/health` screen's one call.
 *
 * The URL stays relative for the same reason as `LeadsService`: in production
 * `api/api-base-url.interceptor.ts` prefixes it with `environment.apiBaseUrl`,
 * and in `ng serve` the empty base URL leaves `proxy.conf.json` in charge.
 *
 * This is now the cheapest way to tell a CORS problem from a dead container:
 * open `/health` on the deployed site. It goes through the same interceptor and
 * the same CORS policy as the waitlist form, but with nothing to fill in.
 */
@Injectable({ providedIn: 'root' })
export class HealthService {
  private readonly http = inject(HttpClient); // Inject function in place of setting this in constructor

  ping(name: string): Observable<IPingResponse> {
    return this.http.get<IPingResponse>('/api/candidates/ping', {
      params: { name },
    });
  }
}
