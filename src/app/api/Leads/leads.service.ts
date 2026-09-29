import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ILeadRequest, ILeadResponse } from './ILead';

/**
 * The one call the waitlist form makes.
 *
 * The URL is relative on purpose, exactly like `HealthService`: in development
 * `proxy.conf.json` forwards `/api` to `localhost:5001`, and in production
 * US-006 is what points it at the Container App. Hard-coding the FQDN here
 * would mean the CORS decision lives in a service instead of in configuration.
 *
 * Until US-004 ships there is no `POST /api/leads` on the other end. That is a
 * known, written-down sequencing — see the ADR — and it is why the form's error
 * path is tested as carefully as its happy path.
 */
@Injectable({ providedIn: 'root' })
export class LeadsService {
  private readonly http = inject(HttpClient);

  create(lead: ILeadRequest): Observable<ILeadResponse> {
    return this.http.post<ILeadResponse>('/api/leads', lead);
  }
}
