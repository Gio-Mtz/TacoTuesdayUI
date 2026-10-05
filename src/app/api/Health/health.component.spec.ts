import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { HealthComponent } from './health.component';
import { IPingResponse } from './IPingResponse';

describe('HealthComponent', () => {
  let component: HealthComponent;
  let fixture: ComponentFixture<HealthComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HealthComponent],

      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(HealthComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    httpMock.expectOne((r) => r.url === '/api/candidates/ping');
  });

  it('should call the ping endpoint with the name as a query param', () => {
    const request = httpMock.expectOne((r) => r.url === '/api/candidates/ping');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('name')).toBe('Gio');
    request.flush({ module: 'Candidates', message: 'Hello, Gio', serverTimeUtc: '2026-09-29T00:00:00Z' });
  });

  it('should render the message returned by the API', async () => {
    const request = httpMock.expectOne((r) => r.url === '/api/candidates/ping');
    const body: IPingResponse = {
      module: 'Candidates',
      message: 'Hello, Gio',
      serverTimeUtc: '2026-09-29T00:00:00Z',
    };
    request.flush(body);

    await fixture.whenStable();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Hello, Gio');
    expect(text).toContain('Candidates');
  });
});
