import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CONSENT_COPY } from '../../core/analytics/consent-copy';
import { ConsentService } from '../../core/analytics/consent.service';
import { PageLang, PageLangService } from '../../core/i18n/page-lang';
import { SITE_INFO } from '../../core/site/site-info';
import { Privacy, formatUpdatedOn } from './privacy';

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

  // The route declares the language and PageHeadStrategy pushes it into
  // PageLangService on every navigation. Here that is done by hand, because the
  // component is mounted without a router.
  async function inLang(lang: PageLang): Promise<void> {
    TestBed.inject(PageLangService).set(lang);
    await fixture.whenStable();
  }

  function headings(): (string | undefined)[] {
    return Array.from(el().querySelectorAll('h2')).map((h) => h.textContent?.trim());
  }

  it('names the same mailbox the footer offers, as the channel to be deleted', async () => {
    await inLang('es-MX');
    const links = Array.from(el().querySelectorAll('a[href^="mailto:"]'));
    expect(links.length).toBeGreaterThan(0);
    links.forEach((link) => {
      expect(link.getAttribute('href')).toBe(`mailto:${SITE_INFO.contactEmail}`);
    });
  });

  describe('the Spanish notice', () => {
    beforeEach(async () => {
      await inLang('es-MX');
    });

    it('covers what a simplified notice has to cover', () => {
      expect(headings()).toEqual([
        'Quién lo recibe',
        'Qué recogemos',
        'Para qué',
        'Cuánto tiempo',
        'Cómo lo borras',
        'Cookies y analítica',
        'Cambios',
      ]);
    });

    it('tells the visitor how current it is, in Spanish', () => {
      expect(el().querySelector('.privacy__updated')!.textContent).toContain(
        formatUpdatedOn(SITE_INFO.privacyUpdatedOn, 'es-MX'),
      );
      expect(el().querySelector('.tt-eyebrow')!.textContent!.trim()).toBe('Aviso de privacidad');
    });
  });

  // US-011. This is the half that did not exist: the banner on `/` is in English
  // and its link used to land on a Spanish page.
  describe('the English notice', () => {
    beforeEach(async () => {
      await inLang('en');
    });

    it('covers the same ground as the Spanish one, section for section', () => {
      expect(headings()).toEqual([
        'Who receives it',
        'What we collect',
        'What for',
        'How long',
        'How you delete it',
        'Cookies and analytics',
        'Changes',
      ]);
    });

    it('has as many sections as the Spanish notice, so nothing was dropped in translation', async () => {
      const english = headings().length;
      await inLang('es-MX');
      expect(headings().length).toBe(english);
    });

    it('says nothing in Spanish', () => {
      const text = el().textContent!;
      ['Aviso de privacidad', 'Qué recogemos', 'Última actualización'].forEach((phrase) =>
        expect(text).not.toContain(phrase),
      );
    });

    it('tells the visitor how current it is, in English', () => {
      expect(el().querySelector('.privacy__updated')!.textContent).toContain(
        formatUpdatedOn(SITE_INFO.privacyUpdatedOn, 'en'),
      );
      expect(el().querySelector('.tt-eyebrow')!.textContent!.trim()).toBe('Privacy notice');
    });

    it('makes the same disclosure about GA4, which is the point of having it', () => {
      expect(el().textContent).toContain('Google Analytics 4');
      const codes = Array.from(el().querySelectorAll('code')).map((c) => c.textContent?.trim());
      expect(codes).toContain('_ga');
      expect(codes).toContain('_ga_*');
    });

    it('drives the consent widget in English too, instead of the pinned es-MX copy', () => {
      expect(el().querySelector('.privacy__consent-title')!.textContent!.trim()).toBe(
        CONSENT_COPY.en.manageTitle,
      );
      expect(el().querySelector('.privacy__consent-state')!.textContent!.trim()).toBe(
        CONSENT_COPY.en.manageUnset,
      );
    });
  });

  describe('formatUpdatedOn', () => {
    it('keeps the day the policy says, not the day the reader happens to be in', () => {
      expect(formatUpdatedOn('2026-10-07', 'en')).toContain('7');
      expect(formatUpdatedOn('2026-10-07', 'en')).toContain('2026');
      expect(formatUpdatedOn('2026-10-07', 'es-MX')).toContain('7');
    });

    it('formats the same date differently per language, which is why it is derived', () => {
      expect(formatUpdatedOn('2026-10-07', 'en')).not.toBe(formatUpdatedOn('2026-10-07', 'es-MX'));
    });
  });

  describe('the cookie section, now that there is analytics to disclose', () => {
    beforeEach(async () => {
      await inLang('es-MX');
    });

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
    beforeEach(async () => {
      await inLang('es-MX');
    });

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
