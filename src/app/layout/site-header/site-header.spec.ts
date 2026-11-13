import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { PageLang, PageLangService } from '../../core/i18n/page-lang';
import { SHELL_COPY } from '../../core/i18n/shell-copy';
import { PageSocialMetaService, SOCIAL_CARDS, SocialCardKey } from '../../core/seo/page-social';
import { routes } from '../../app.routes';
import { SiteHeader } from './site-header';

describe('SiteHeader', () => {
  let fixture: ComponentFixture<SiteHeader>;

  beforeEach(async () => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');

    await TestBed.configureTestingModule({
      imports: [SiteHeader],
      providers: [provideRouter(routes)],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteHeader);
    await fixture.whenStable();
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  async function onCard(key: SocialCardKey, lang: PageLang): Promise<void> {
    TestBed.inject(PageLangService).set(lang);
    TestBed.inject(PageSocialMetaService).apply(SOCIAL_CARDS[key]);
    await fixture.whenStable();
  }

  function marked(): readonly string[] {
    return Array.from(el().querySelectorAll('nav a[aria-current="page"]')).map(
      (a) => a.getAttribute('href') ?? '',
    );
  }

  it('is a banner landmark with a labelled nav inside it', () => {
    expect(el().querySelector('header')).toBeTruthy();
    expect(el().querySelector('nav')!.getAttribute('aria-label')).toBe('Sections');
  });

  it('sends the English shell to the companies page and the landing sections', () => {
    const hrefs = Array.from(el().querySelectorAll('nav a')).map((a) => a.getAttribute('href'));

    expect(hrefs).toEqual(['/companies#for-companies', '/engineers#engineers', '/#how-it-works']);
  });

  it('says nothing about language while the link and the page agree', () => {
    const flags = Array.from(el().querySelectorAll('nav a')).map((a) => a.getAttribute('hreflang'));
    expect(flags).toEqual([null, null, null]);
  });

  it('carries the theme toggle', () => {
    expect(el().querySelector('ttco-theme-toggle button')).toBeTruthy();
  });

  it('sends the wordmark home', () => {
    expect(el().querySelector('.site-header__brand')!.getAttribute('href')).toBe('/');
  });
  it('speaks the language of the page it is framing', async () => {
    TestBed.inject(PageLangService).set('es-MX');
    await fixture.whenStable();

    const labels = Array.from(el().querySelectorAll('nav a')).map((a) => a.textContent?.trim());
    expect(labels).toEqual(['Para empresas', 'Para devs']);
    expect(el().querySelector('nav')!.getAttribute('aria-label')).toBe('Secciones');
  });

  it('sends the Spanish shell to the Spanish page — US-010 reversed this', async () => {
    TestBed.inject(PageLangService).set('es-MX');
    await fixture.whenStable();

    const hrefs = Array.from(el().querySelectorAll('nav a')).map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/empresas#para-empresas', '/talento#para-devs']);
  });

  it('still says nothing about language on the Spanish shell', async () => {
    TestBed.inject(PageLangService).set('es-MX');
    await fixture.whenStable();

    const flags = Array.from(el().querySelectorAll('nav a')).map((a) => a.getAttribute('hreflang'));
    expect(flags).toEqual(SHELL_COPY['es-MX'].nav.map(() => null));
  });

  it('defaults to English, which is what index.html ships', () => {
    expect(TestBed.inject(PageLangService).lang()).toBe('en');
    expect(el().querySelector('nav a')!.textContent?.trim()).toBe(SHELL_COPY.en.nav[0].label);
  });
  // US-030. Every entry is hand-written in SHELL_COPY; the page's route comes from
  // the card the router applied, so these cross two sources instead of a literal.
  it('marks the entry that leads to the page being framed, and only that one', async () => {
    const onPage: Readonly<Record<string, PageLang>> = {
      talento: 'es-MX',
      engineers: 'en',
      empresas: 'es-MX',
      companies: 'en',
    };

    for (const [key, lang] of Object.entries(onPage) as [SocialCardKey, PageLang][]) {
      await onCard(key, lang);

      const route = SOCIAL_CARDS[key].route;
      const hit = marked();

      expect(hit.length).toBe(1);
      expect(hit[0]!.startsWith(route)).toBe(true);
    }
  });

  it('marks the home entry on the home page — the one nav link that leads to /', async () => {
    await onCard('home', 'en');

    const home = SHELL_COPY.en.nav.filter((link) => link.path === SOCIAL_CARDS.home.route);
    expect(home.length).toBe(1);
    expect(marked()).toEqual([`${SOCIAL_CARDS.home.route}#${home[0]!.fragment}`]);
  });

  it('marks nothing on a route no nav entry leads to', async () => {
    const elsewhere: readonly [SocialCardKey, PageLang][] = [
      ['privacy', 'en'],
      ['privacidad', 'es-MX'],
      ['notfound', 'en'],
      ['health', 'en'],
    ];

    for (const [key, lang] of elsewhere) {
      await onCard(key, lang);
      expect(marked()).toEqual([]);
    }
  });

  it('marks nothing before the router has applied a card', () => {
    expect(marked()).toEqual([]);
  });

  it('gives the marked entry a class the stylesheet can reach', async () => {
    await onCard('companies', 'en');

    const hit = el().querySelector('nav a[aria-current="page"]')!;
    expect(hit.classList.contains('site-header__link--current')).toBe(true);

    const rest = Array.from(el().querySelectorAll('nav a:not([aria-current])'));
    expect(rest.length).toBe(SHELL_COPY.en.nav.length - 1);
    expect(rest.every((a) => !a.classList.contains('site-header__link--current'))).toBe(true);
  });

  it('keeps the marked entry a link, so the fragment still works', async () => {
    await onCard('engineers', 'en');

    const hit = el().querySelector('nav a[aria-current="page"]')!;
    expect(hit.tagName).toBe('A');
    expect(hit.getAttribute('href')).toBe(`${SOCIAL_CARDS.engineers.route}#engineers`);
  });
});
