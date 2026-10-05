import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IPingResponse } from './IPingResponse';

@Injectable({ providedIn: 'root' })
export class HealthService {
  private readonly http = inject(HttpClient);

  ping(name: string): Observable<IPingResponse> {
    return this.http.get<IPingResponse>('/api/candidates/ping', {
      params: { name },
    });
  }
}
