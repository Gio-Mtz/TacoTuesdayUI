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
    // Full paths, not bare hashes: the same link has to work from /privacidad.
    expect(hrefs).toEqual(['/#companies', '/#engineers', '/#how-it-works']);
  });

  it('carries the theme toggle', () => {
    expect(el().querySelector('ttco-theme-toggle button')).toBeTruthy();
  });

  it('sends the wordmark home', () => {
    expect(el().querySelector('.site-header__brand')!.getAttribute('href')).toBe('/');
  });
  it('speaks the language of the page it is framing', async () => {
    // The shell is shared by `/` (English) and `/privacidad` (Spanish, because
    // it is a Mexican aviso de privacidad). Before US-009 this could not be
    // wrong, because there was one language; now an English header around
    // Spanish legal text is one forgotten signal read away.
    TestBed.inject(PageLangService).set('es-MX');
    await fixture.whenStable();

    const labels = Array.from(el().querySelectorAll('nav a')).map((a) => a.textContent?.trim());
    expect(labels).toEqual(['Empresas', 'Candidatos', 'Cómo funciona']);
    expect(el().querySelector('nav')!.getAttribute('aria-label')).toBe('Secciones');
  });

  it('keeps the same destinations when the language changes', async () => {
    // The labels translate; the anchors do not. They are ids of sections on the
    // English landing, and a translated fragment would scroll to nothing.
    TestBed.inject(PageLangService).set('es-MX');
    await fixture.whenStable();

    const hrefs = Array.from(el().querySelectorAll('nav a')).map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/#companies', '/#engineers', '/#how-it-works']);
  });

  it('defaults to English, which is what index.html ships', () => {
    expect(TestBed.inject(PageLangService).lang()).toBe('en');
    expect(el().querySelector('nav a')!.textContent?.trim()).toBe(SHELL_COPY.en.navCompanies);
  });
});
