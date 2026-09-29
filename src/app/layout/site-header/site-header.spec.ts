import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

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
    expect(el().querySelector('nav')!.getAttribute('aria-label')).toBe('Secciones');
  });

  it('links to every section of the landing, from any route', () => {
    const hrefs = Array.from(el().querySelectorAll('nav a')).map((a) => a.getAttribute('href'));
    // Full paths, not bare hashes: the same link has to work from /privacidad.
    expect(hrefs).toEqual(['/#empresas', '/#candidatos', '/#como-funciona']);
  });

  it('carries the theme toggle', () => {
    expect(el().querySelector('ttco-theme-toggle button')).toBeTruthy();
  });

  it('sends the wordmark home', () => {
    expect(el().querySelector('.site-header__brand')!.getAttribute('href')).toBe('/');
  });
});
