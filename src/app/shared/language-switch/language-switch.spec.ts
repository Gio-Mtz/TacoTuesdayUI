import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { LanguageSwitch } from './language-switch';
import { PageLangService } from '../../core/i18n/page-lang';
import { PageSocialMetaService, SOCIAL_CARDS } from '../../core/seo/page-social';
import { routes } from '../../app.routes';

describe('LanguageSwitch', () => {
  let fixture: ComponentFixture<LanguageSwitch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LanguageSwitch],
      providers: [provideRouter(routes)],
    }).compileComponents();

    fixture = TestBed.createComponent(LanguageSwitch);
    await fixture.whenStable();
  });

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function link(): HTMLAnchorElement | null {
    return el().querySelector('a.language-switch');
  }

  async function onCard(key: keyof typeof SOCIAL_CARDS, lang: 'en' | 'es-MX'): Promise<void> {
    TestBed.inject(PageLangService).set(lang);
    TestBed.inject(PageSocialMetaService).apply(SOCIAL_CARDS[key]);
    await fixture.whenStable();
  }

  it('renders nothing before a navigation has applied a card', () => {
    expect(link()).toBeNull();
  });

  it('renders nothing on a route with no translation', async () => {
    await onCard('home', 'en');
    expect(link()).toBeNull();
  });

  it('stays hidden on /talento, which is a different audience and not a translation', async () => {
    await onCard('talento', 'es-MX');
    expect(link()).toBeNull();
  });

  it('offers English on the Spanish notice', async () => {
    await onCard('privacidad', 'es-MX');

    expect(link()!.textContent!.trim()).toBe('English');
    expect(link()!.getAttribute('href')).toBe('/privacy');
  });

  it('offers Spanish on the English notice', async () => {
    await onCard('privacy', 'en');

    expect(link()!.textContent!.trim()).toBe('Español');
    expect(link()!.getAttribute('href')).toBe('/privacidad');
  });

  it('tells assistive tech the target language, not just the word', async () => {
    await onCard('privacidad', 'es-MX');

    expect(link()!.getAttribute('aria-label')).toBe('Leer esta página en: English');
    expect(link()!.getAttribute('hreflang')).toBe('en');
    expect(link()!.getAttribute('lang')).toBe('en');
  });

  it('labels itself in the language of the page it is sitting on', async () => {
    await onCard('privacy', 'en');

    expect(link()!.getAttribute('aria-label')).toBe('Read this page in: Español');
    expect(link()!.getAttribute('lang')).toBe('es-MX');
  });

  it('disappears again when a navigation lands on a route without a translation', async () => {
    await onCard('privacidad', 'es-MX');
    expect(link()).not.toBeNull();

    await onCard('home', 'en');
    expect(link()).toBeNull();
  });
});
