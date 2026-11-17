import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { HEALTH_COPY } from './health-copy';
import { HealthComponent } from './health.component';
import { IPingResponse } from './IPingResponse';
import { PageLangService } from '../../core/i18n/page-lang';
import { SITE_INFO } from '../../core/site/site-info';

describe('HealthComponent', () => {
  let component: HealthComponent;
  let fixture: ComponentFixture<HealthComponent>;
  let httpMock: HttpTestingController;

  const PONG: IPingResponse = {
    module: 'Candidates',
    message: 'Hello, Gio',
    serverTimeUtc: '2026-09-29T00:00:00Z',
  };

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

  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;

  const answer = async (body: IPingResponse = PONG): Promise<void> => {
    httpMock.expectOne((r) => r.url === '/api/candidates/ping').flush(body);
    await fixture.whenStable();
  };

  it('should create', () => {
    expect(component).toBeTruthy();
    httpMock.expectOne((r) => r.url === '/api/candidates/ping');
  });

  it('should call the ping endpoint with the name as a query param', () => {
    const request = httpMock.expectOne((r) => r.url === '/api/candidates/ping');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('name')).toBe('Gio');
    request.flush(PONG);
  });

  it('should render the message returned by the API', async () => {
    await answer();

    const text = host().textContent ?? '';
    expect(text).toContain('Hello, Gio');
    expect(text).toContain('Candidates');
  });

  // Scoped to the h1 ON PURPOSE. In the running app the footer prints
  // `SITE_INFO.legalName` twice on this route, so a `text()` assertion over the
  // page would pass whatever this heading said -- the US-031 trap, written down
  // here so nobody widens the selector.
  it('names the page in its own h1, and leaves the company to the footer', async () => {
    await answer();

    const headings = host().querySelectorAll('h1');
    expect(headings.length).toBe(1);
    expect(headings[0].textContent?.trim()).toBe(HEALTH_COPY.en.title);
    expect(headings[0].textContent).not.toContain(SITE_INFO.legalName);
  });

  it('follows the page language instead of hardcoding English', async () => {
    await answer();
    TestBed.inject(PageLangService).set('es-MX');
    await fixture.whenStable();

    expect(host().querySelector('h1')?.textContent?.trim()).toBe(HEALTH_COPY['es-MX'].title);
    expect(host().querySelector('.tt-eyebrow')?.textContent?.trim()).toBe(
      HEALTH_COPY['es-MX'].eyebrow,
    );
  });

  // `app.html` already wraps the router outlet in `<main id="contenido">`, which
  // the skip link targets. A second one nested inside it is two main landmarks
  // on one page.
  it('opens no main of its own: the shell already provides one', async () => {
    await answer();

    expect(host().querySelectorAll('main').length).toBe(0);
    expect(host().querySelectorAll('section.tt-section').length).toBe(1);
  });

  it('labels the two facts the API returns instead of printing them bare', async () => {
    await answer();

    const terms = Array.from(host().querySelectorAll('.health__facts dt')).map((dt) =>
      dt.textContent?.trim(),
    );
    expect(terms).toEqual([HEALTH_COPY.en.moduleLabel, HEALTH_COPY.en.serverTimeLabel]);

    expect(host().querySelector('.health__module')?.textContent?.trim()).toBe(PONG.module);
    expect(host().querySelector('.health__time')?.textContent?.trim()).toBe(PONG.serverTimeUtc);
  });

  it('says it is waiting before the API has answered', async () => {
    await fixture.whenStable();

    expect(host().querySelector('.health__waiting')?.textContent?.trim()).toBe(
      HEALTH_COPY.en.waiting,
    );
    expect(host().querySelector('.health__facts')).toBeNull();

    await answer();
    expect(host().querySelector('.health__waiting')).toBeNull();
  });
});
