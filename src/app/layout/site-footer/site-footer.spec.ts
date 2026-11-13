import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { routes } from '../../app.routes';
import { LANGUAGE_ENDONYM } from '../../core/i18n/language-switch';
import { PageLang, PageLangService } from '../../core/i18n/page-lang';
import { PageSocialMetaService, SOCIAL_CARDS, SocialCardKey } from '../../core/seo/page-social';
import { SITE_INFO } from '../../core/site/site-info';
import { SiteFooter } from './site-footer';

const SHELL_LABEL: Readonly<Record<PageLang, string>> = {
  en: 'Read this page in',
  'es-MX': 'Leer esta página en',
};

describe('SiteFooter', () => {
  let fixture: ComponentFixture<SiteFooter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteFooter],
      providers: [provideRouter(routes)],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteFooter);
    await fixture.whenStable();
  });

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function twin(): HTMLAnchorElement | null {
    return el().querySelector('a.site-footer__twin');
  }

  function words(node: Element | null): string {
    return (node?.textContent ?? '').replace(/\s+/g, ' ').trim();
  }

  async function onCard(key: SocialCardKey, lang: PageLang): Promise<void> {
    TestBed.inject(PageLangService).set(lang);
    TestBed.inject(PageSocialMetaService).apply(SOCIAL_CARDS[key]);
    await fixture.whenStable();
  }

  it('is a contentinfo landmark', () => {
    expect(el().querySelector('footer')).toBeTruthy();
  });

  it('offers a way to write to a human', () => {
    const mail = el().querySelector('a[href^="mailto:"]')!;
    expect(mail.getAttribute('href')).toBe(`mailto:${SITE_INFO.contactEmail}`);
    expect(mail.textContent).toContain(SITE_INFO.contactEmail);
  });

  it('links the privacy notice — required the moment the form captures an email', () => {
    expect(el().querySelector('a[href="/privacy"]')).toBeTruthy();
  });

  // US-011 reversed this one. It used to assert hreflang="es-MX" on an English
  // shell, which was the bug written down as an expectation: the only notice
  // that existed was the Spanish one.
  it('no longer sends an English reader to the Spanish notice', () => {
    expect(el().querySelector('a[href="/privacidad"]')).toBeNull();
    expect(el().querySelector('a[href="/privacy"]')!.getAttribute('hreflang')).toBe('en');
  });

  it('sends a Spanish reader to the Spanish notice', async () => {
    TestBed.inject(PageLangService).set('es-MX');
    await fixture.whenStable();

    expect(el().querySelector('a[href="/privacy"]')).toBeNull();
    expect(el().querySelector('a[href="/privacidad"]')!.getAttribute('hreflang')).toBe('es-MX');
  });

  it('speaks the language of the page it is framing', async () => {
    TestBed.inject(PageLangService).set('es-MX');
    await fixture.whenStable();

    expect(el().querySelector('.site-footer__tagline')!.textContent?.trim()).toBe(
      'Entrevistas con fecha, con feedback y sin silencios.',
    );
    expect(el().querySelector('a[href="/privacidad"]')!.textContent?.trim()).toBe(
      'Aviso de privacidad',
    );
  });

  // US-029 narrowed these two. They used to assert the hand-written link on
  // EVERY page, which is how the footer kept offering `/talento` to a reader of
  // `/companies` for 26 days. The door itself is still right where it is the
  // only thing on offer: before a navigation, and on a route with no twin.
  it('carries the door to the other audience, labelled in its own language', () => {
    const cross = el().querySelector('a[href="/talento"]')!;
    expect(cross).toBeTruthy();
    expect(cross.textContent?.trim()).toBe('Para devs');

    expect(cross.getAttribute('hreflang')).toBe('es-MX');
  });

  it('points the Spanish footer back at the English landing instead', async () => {
    TestBed.inject(PageLangService).set('es-MX');
    await fixture.whenStable();

    expect(el().querySelector('a[href="/talento"]')).toBeNull();

    const cross = el().querySelector('nav a[hreflang="en"]')!;
    expect(cross.getAttribute('href')).toBe('/');
    expect(cross.textContent?.trim()).toBe('For companies');
  });

  it('keeps that door on the home page, the one route with no twin to offer', async () => {
    await onCard('home', 'en');

    expect(twin()).toBeNull();
    expect(el().querySelector('a[href="/talento"]')!.textContent?.trim()).toBe('Para devs');
  });

  // The route comes from the manifest's own `translation` pointer, not from a
  // literal: a card that loses its twin takes this link with it.
  describe.each([
    ['talento', 'es-MX'],
    ['engineers', 'en'],
    ['empresas', 'es-MX'],
    ['companies', 'en'],
    ['privacy', 'en'],
    ['privacidad', 'es-MX'],
  ] as const)('on %s', (key, lang) => {
    it('offers the same page in the other language, never another audience', async () => {
      await onCard(key, lang);

      const other = SOCIAL_CARDS[SOCIAL_CARDS[key].translation!];
      const link = twin()!;

      expect(link.getAttribute('href')).toBe(other.route);
      expect(link.getAttribute('hreflang')).toBe(other.lang);
      expect(words(link)).toBe(`${SHELL_LABEL[lang]} ${LANGUAGE_ENDONYM[other.lang]}`);
    });

    it('names the other language in that language, so a screen reader switches voice', async () => {
      await onCard(key, lang);

      const endonym = twin()!.querySelector('span')!;
      const other = SOCIAL_CARDS[SOCIAL_CARDS[key].translation!];

      expect(endonym.getAttribute('lang')).toBe(other.lang);
      expect(endonym.textContent?.trim()).toBe(LANGUAGE_ENDONYM[other.lang]);
    });

    it('stops offering the hand-written door once the page has a twin', async () => {
      await onCard(key, lang);

      // Not by href: on /engineers the twin IS /talento, the same address the
      // hand-written door used. The label is what tells the two apart.
      const labels = [...el().querySelectorAll('nav a')].map((link) => words(link));

      expect(labels).toHaveLength(3);
      expect(labels).not.toContain('Para devs');
      expect(labels).not.toContain('For companies');
    });
  });

  it('says where it was made in both languages, because that is the brand', () => {
    expect(el().querySelector('.site-footer__legal')!.textContent).toContain('Guadalajara');
  });

  it('shows the current year', () => {
    expect(el().querySelector('.site-footer__legal')!.textContent).toContain(
      String(new Date().getFullYear()),
    );
  });
  // US-030. On /privacy and /privacidad this link is the page it sits on: no
  // fragment, same address, nothing happens on the click.
  it('marks the privacy link when the visitor is already on the notice', async () => {
    for (const [key, lang] of [
      ['privacy', 'en'],
      ['privacidad', 'es-MX'],
    ] as [SocialCardKey, PageLang][]) {
      await onCard(key, lang);

      const hit = el().querySelector('nav a[aria-current="page"]')!;
      expect(hit.getAttribute('href')).toBe(SOCIAL_CARDS[key].route);
      expect(hit.classList.contains('site-footer__link--current')).toBe(true);
    }
  });

  it('leaves the privacy link unmarked on every page that is not the notice', async () => {
    for (const [key, lang] of [
      ['home', 'en'],
      ['talento', 'es-MX'],
      ['engineers', 'en'],
      ['empresas', 'es-MX'],
      ['companies', 'en'],
    ] as [SocialCardKey, PageLang][]) {
      await onCard(key, lang);
      expect(el().querySelectorAll('nav a[aria-current]').length).toBe(0);
    }
  });

  // The twin and the crossLanguage fallback both lead to a DIFFERENT page by
  // definition, so neither can ever be the page the visitor is on.
  it('never marks the language door, on any route', async () => {
    for (const key of Object.keys(SOCIAL_CARDS) as SocialCardKey[]) {
      await onCard(key, SOCIAL_CARDS[key].lang);

      expect(twin()?.getAttribute('aria-current') ?? null).toBeNull();
      expect(el().querySelector('a.site-footer__twin[aria-current]')).toBeNull();
    }
  });

  it('marks nothing before the router has applied a card', () => {
    expect(el().querySelectorAll('nav a[aria-current]').length).toBe(0);
  });
});
