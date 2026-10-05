import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { PageLangService } from '../../core/i18n/page-lang';
import { SHELL_COPY } from '../../core/i18n/shell-copy';
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

  it('is a banner landmark with a labelled nav inside it', () => {
    expect(el().querySelector('header')).toBeTruthy();
    expect(el().querySelector('nav')!.getAttribute('aria-label')).toBe('Sections');
  });

  it('links to every section of the landing, from any route', () => {
    const hrefs = Array.from(el().querySelectorAll('nav a')).map((a) => a.getAttribute('href'));

    expect(hrefs).toEqual(['/#companies', '/#engineers', '/#how-it-works']);
  });

  it('says nothing about language while the link and the page agree', () => {
    const flags = Array.from(el().querySelectorAll('nav a')).map((a) =>
      a.getAttribute('hreflang'),
    );
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
    expect(labels).toEqual(['Para devs', 'Cómo funciona', 'Lista de espera']);
    expect(el().querySelector('nav')!.getAttribute('aria-label')).toBe('Secciones');
  });

  it('sends the Spanish shell to the Spanish page — US-010 reversed this', async () => {
    TestBed.inject(PageLangService).set('es-MX');
    await fixture.whenStable();

    const hrefs = Array.from(el().querySelectorAll('nav a')).map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual([
      '/talento#para-devs',
      '/talento#como-funciona',
      '/talento#lista-de-espera',
    ]);
  });

  it('still says nothing about language on the Spanish shell', async () => {
    TestBed.inject(PageLangService).set('es-MX');
    await fixture.whenStable();

    const flags = Array.from(el().querySelectorAll('nav a')).map((a) =>
      a.getAttribute('hreflang'),
    );
    expect(flags).toEqual([null, null, null]);
  });

  it('defaults to English, which is what index.html ships', () => {
    expect(TestBed.inject(PageLangService).lang()).toBe('en');
    expect(el().querySelector('nav a')!.textContent?.trim()).toBe(SHELL_COPY.en.nav[0].label);
  });
});
