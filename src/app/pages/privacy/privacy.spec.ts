import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CONSENT_COPY } from '../../core/analytics/consent-copy';
import { ConsentService } from '../../core/analytics/consent.service';
import { SITE_INFO } from '../../core/site/site-info';
import { Privacy } from './privacy';

describe('Privacy', () => {
  let fixture: ComponentFixture<Privacy>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [Privacy] }).compileComponents();
    fixture = TestBed.createComponent(Privacy);
    await fixture.whenStable();
  });

  afterEach(() => {
    localStorage.clear();
  });

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('names the same mailbox the footer offers, as the channel to be deleted', () => {
    const links = Array.from(el().querySelectorAll('a[href^="mailto:"]'));
    expect(links.length).toBeGreaterThan(0);
    links.forEach((link) => {
      expect(link.getAttribute('href')).toBe(`mailto:${SITE_INFO.contactEmail}`);
    });
  });

  it('covers what a simplified notice has to cover', () => {
    const headings = Array.from(el().querySelectorAll('h2')).map((h) => h.textContent?.trim());
    expect(headings).toEqual([
      'Quién lo recibe',
      'Qué recogemos',
      'Para qué',
      'Cuánto tiempo',
      'Cómo lo borras',
      'Cookies y analítica',
      'Cambios',
    ]);
  });

  it('tells the visitor how current it is', () => {
    expect(el().querySelector('.privacy__updated')!.textContent).toContain(
      SITE_INFO.privacyUpdatedAt,
    );
  });

  describe('the cookie section, now that there is analytics to disclose', () => {
    it('names the provider instead of hiding it behind "third parties"', () => {
      expect(el().textContent).toContain('Google Analytics 4');
    });

    it('names the cookies GA4 actually sets', () => {
      const codes = Array.from(el().querySelectorAll('code')).map((c) => c.textContent?.trim());
      expect(codes).toContain('_ga');
      expect(codes).toContain('_ga_*');
    });

    it('no longer claims the page sets no tracking cookies', () => {
      expect(el().textContent).not.toContain('no usa cookies de rastreo');
    });
  });

  describe('withdrawing consent', () => {
    function state(): string {
      return el().querySelector('.privacy__consent-state')!.textContent!.trim();
    }

    function changeButton(): HTMLButtonElement {
      return el().querySelector('.privacy__consent button')!;
    }

    it('reports that nothing is loaded while the visitor has not chosen', () => {
      expect(state()).toBe(CONSENT_COPY['es-MX'].manageUnset);
    });

    it('reports an acceptance back to the visitor', async () => {
      TestBed.inject(ConsentService).grant();
      await fixture.whenStable();
      expect(state()).toBe(CONSENT_COPY['es-MX'].manageGranted);
    });

    it('reports a rejection back to the visitor', async () => {
      TestBed.inject(ConsentService).deny();
      await fixture.whenStable();
      expect(state()).toBe(CONSENT_COPY['es-MX'].manageDenied);
    });

    it('takes consent back to unset, so withdrawing is as easy as giving it', async () => {
      const consent = TestBed.inject(ConsentService);
      consent.grant();
      await fixture.whenStable();

      changeButton().click();
      await fixture.whenStable();

      expect(consent.state()).toBe('unset');
      expect(state()).toBe(CONSENT_COPY['es-MX'].manageUnset);
    });
  });
});
