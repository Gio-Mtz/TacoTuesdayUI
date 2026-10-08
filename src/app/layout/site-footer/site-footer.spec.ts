import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { routes } from '../../app.routes';
import { PageLangService } from '../../core/i18n/page-lang';
import { SITE_INFO } from '../../core/site/site-info';
import { SiteFooter } from './site-footer';

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

  it('says where it was made in both languages, because that is the brand', () => {
    expect(el().querySelector('.site-footer__legal')!.textContent).toContain('Guadalajara');
  });

  it('shows the current year', () => {
    expect(el().querySelector('.site-footer__legal')!.textContent).toContain(
      String(new Date().getFullYear()),
    );
  });
});
