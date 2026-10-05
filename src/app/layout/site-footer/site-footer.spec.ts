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
    expect(el().querySelector('a[href="/privacidad"]')).toBeTruthy();
  });

  it('warns that the privacy notice is in another language', () => {
    // The landing is English and the notice is Spanish by law, so that link
    // changes language. `hreflang` is the one attribute that says so without
    // spending a word of visible copy on it — and it is static because the
    // TARGET is always Spanish, whichever page the footer is on.
    const privacy = el().querySelector('a[href="/privacidad"]')!;
    expect(privacy.getAttribute('hreflang')).toBe('es-MX');
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
    // US-010. The footer and not the nav: `/talento` is not a section of what you
    // are reading, it is the other half of the business, and whoever wants it is
    // looking for it rather than scanning for it.
    const cross = el().querySelector('a[href="/talento"]')!;
    expect(cross).toBeTruthy();
    expect(cross.textContent?.trim()).toBe('Para devs');
    // The label is already Spanish; `hreflang` is what tells a machine.
    expect(cross.getAttribute('hreflang')).toBe('es-MX');
  });

  it('points the Spanish footer back at the English landing instead', async () => {
    // Which language is "the other one" depends on the page the footer is on, so
    // the link is data. On `/talento` and `/privacidad` the door goes the other
    // way, and a second `/talento` link there would point at the page you are on.
    TestBed.inject(PageLangService).set('es-MX');
    await fixture.whenStable();

    expect(el().querySelector('a[href="/talento"]')).toBeNull();

    const cross = el().querySelector('nav a[hreflang="en"]')!;
    expect(cross.getAttribute('href')).toBe('/');
    expect(cross.textContent?.trim()).toBe('For companies');
  });

  it('says where it was made in both languages, because that is the brand', () => {
    // `brand.md`: the origin is the differentiator, not something to erase for
    // an English-speaking buyer.
    expect(el().querySelector('.site-footer__legal')!.textContent).toContain('Guadalajara');
  });

  it('shows the current year', () => {
    expect(el().querySelector('.site-footer__legal')!.textContent).toContain(
      String(new Date().getFullYear()),
    );
  });
});
