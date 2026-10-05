import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ILeadRequest, ILeadResponse } from './ILead';

@Injectable({ providedIn: 'root' })
export class LeadsService {
  private readonly http = inject(HttpClient);

  create(lead: ILeadRequest): Observable<ILeadResponse> {
    return this.http.post<ILeadResponse>('/api/leads', lead);
  }
}
