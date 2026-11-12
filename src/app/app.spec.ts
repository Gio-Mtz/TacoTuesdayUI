import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';
import { PageLang, PageLangService } from './core/i18n/page-lang';
import { PageSocialMetaService, SOCIAL_CARDS, SocialCardKey } from './core/seo/page-social';

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');

    await TestBed.configureTestingModule({
      imports: [App],

      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the router outlet', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });

  it('frames every route with the header and the footer', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('ttco-site-header header')).toBeTruthy();
    expect(compiled.querySelector('ttco-site-footer footer')).toBeTruthy();
  });

  it('puts the routed page inside a focusable main landmark', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const main = (fixture.nativeElement as HTMLElement).querySelector('main')!;

    expect(main.id).toBe('contenido');

    expect(main.getAttribute('tabindex')).toBe('-1');
    expect(main.querySelector('router-outlet')).toBeTruthy();
  });

  it('mounts the cookie banner in the shell, so every route can ask', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('ttco-cookie-banner')).toBeTruthy();
  });

  it('asks nothing when no analytics id is configured, which is what ng test gets', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.cookie-banner')).toBeNull();
  });

  // US-029: the header switch and the footer link are two components reading
  // the same card. This is the only place both are mounted, so it is the only
  // place the agreement can be measured.
  it.each([
    ['talento', 'es-MX'],
    ['engineers', 'en'],
    ['empresas', 'es-MX'],
    ['companies', 'en'],
    ['privacy', 'en'],
    ['privacidad', 'es-MX'],
  ] as const)(
    'never lets the header and the footer disagree about the other language on %s',
    async (key: SocialCardKey, lang: PageLang) => {
      const fixture = TestBed.createComponent(App);
      await fixture.whenStable();

      TestBed.inject(PageLangService).set(lang);
      TestBed.inject(PageSocialMetaService).apply(SOCIAL_CARDS[key]);
      await fixture.whenStable();

      const compiled = fixture.nativeElement as HTMLElement;
      const header = compiled.querySelector('header a.language-switch')!;
      const footer = compiled.querySelector('footer a.site-footer__twin')!;

      expect(header.getAttribute('href')).toBe(footer.getAttribute('href'));
      expect(header.getAttribute('href')).toBe(SOCIAL_CARDS[SOCIAL_CARDS[key].translation!].route);
    },
  );

  it('opens the tab order with a skip link that targets that main', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const skip = compiled.querySelector('a')!;

    expect(skip.classList.contains('tt-skip-link')).toBe(true);
    expect(skip.getAttribute('href')).toBe('#contenido');
  });
});
