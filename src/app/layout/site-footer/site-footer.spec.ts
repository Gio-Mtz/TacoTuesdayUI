import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { routes } from '../../app.routes';
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

  it('shows the current year', () => {
    expect(el().querySelector('.site-footer__legal')!.textContent).toContain(
      String(new Date().getFullYear()),
    );
  });
});
