import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { CONSENT_COPY } from '../../core/analytics/consent-copy';
import { ConsentService } from '../../core/analytics/consent.service';
import { ANALYTICS_MEASUREMENT_ID } from '../../core/analytics/analytics.service';
import { PageLangService } from '../../core/i18n/page-lang';
import { CookieBanner } from './cookie-banner';

const REAL_ID = 'G-ABC1234567';

describe('CookieBanner', () => {
  let fixture: ComponentFixture<CookieBanner>;

  async function mount(measurementId = REAL_ID): Promise<void> {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [CookieBanner],
      providers: [
        provideRouter([]),
        { provide: ANALYTICS_MEASUREMENT_ID, useValue: measurementId },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CookieBanner);
    await fixture.whenStable();
  }

  beforeEach(async () => {
    localStorage.clear();
    await mount();
  });

  afterEach(() => {
    localStorage.clear();
    document.querySelectorAll('#tt-ga4').forEach((tag) => tag.remove());
  });

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function panel(): HTMLElement | null {
    return el().querySelector('.cookie-banner');
  }

  function buttonLabelled(text: string): HTMLButtonElement {
    const match = Array.from(el().querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === text,
    );
    expect(match, `no button labelled "${text}"`).toBeTruthy();
    return match as HTMLButtonElement;
  }

  it('asks before anything is loaded', () => {
    expect(panel()).toBeTruthy();
  });

  it('is announced as a region named by its own visible heading', () => {
    expect(panel()!.getAttribute('role')).toBe('region');
    const labelledBy = panel()!.getAttribute('aria-labelledby')!;
    expect(el().querySelector(`#${labelledBy}`)!.textContent?.trim()).toBe(
      CONSENT_COPY['en'].title,
    );
  });

  it('offers reject and accept as two real buttons, not a single "got it"', () => {
    expect(buttonLabelled(CONSENT_COPY['en'].reject).type).toBe('button');
    expect(buttonLabelled(CONSENT_COPY['en'].accept).type).toBe('button');
  });

  it('puts reject before accept in the tab order, so the cheap choice is not the hidden one', () => {
    const labels = Array.from(el().querySelectorAll('button')).map((b) => b.textContent?.trim());
    expect(labels).toEqual([CONSENT_COPY['en'].reject, CONSENT_COPY['en'].accept]);
  });

  // This is the bug from Gio's mailbox, as a test: the banner correctly spoke
  // English on `/` and then handed the reader a Spanish page.
  it('links to the privacy notice in the language it is speaking', () => {
    const link = el().querySelector<HTMLAnchorElement>('.cookie-banner__link')!;
    expect(link.getAttribute('href')).toBe('/privacy');
    expect(link.getAttribute('hreflang')).toBe('en');
  });

  it('links to the Spanish notice on a Spanish page', async () => {
    TestBed.inject(PageLangService).set('es-MX');
    await fixture.whenStable();

    const link = el().querySelector<HTMLAnchorElement>('.cookie-banner__link')!;
    expect(link.getAttribute('href')).toBe('/privacidad');
    expect(link.getAttribute('hreflang')).toBe('es-MX');
  });

  it('disappears once the visitor accepts, and records it', async () => {
    buttonLabelled(CONSENT_COPY['en'].accept).click();
    await fixture.whenStable();

    expect(TestBed.inject(ConsentService).state()).toBe('granted');
    expect(panel()).toBeNull();
  });

  it('disappears once the visitor rejects, and records that too', async () => {
    buttonLabelled(CONSENT_COPY['en'].reject).click();
    await fixture.whenStable();

    expect(TestBed.inject(ConsentService).state()).toBe('denied');
    expect(panel()).toBeNull();
  });

  it('speaks the language of the page it sits on', async () => {
    TestBed.inject(PageLangService).set('es-MX');
    await fixture.whenStable();

    expect(el().querySelector('.cookie-banner__title')!.textContent?.trim()).toBe(
      CONSENT_COPY['es-MX'].title,
    );
  });

  it('does not ask for consent it has no use for, when no measurement id is configured', async () => {
    await mount('');
    expect(panel()).toBeNull();
  });
});
