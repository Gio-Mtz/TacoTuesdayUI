import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SITE_INFO } from '../../core/site/site-info';
import { Privacy } from './privacy';

describe('Privacy', () => {
  let fixture: ComponentFixture<Privacy>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Privacy] }).compileComponents();
    fixture = TestBed.createComponent(Privacy);
    await fixture.whenStable();
  });

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('names the same mailbox the footer offers, as the channel to be deleted', () => {
    // If these two ever drift, the notice promises a channel that nobody reads.
    const links = Array.from(el().querySelectorAll('a[href^="mailto:"]'));
    expect(links.length).toBeGreaterThan(0);
    links.forEach((link) => {
      expect(link.getAttribute('href')).toBe(`mailto:${SITE_INFO.contactEmail}`);
    });
  });

  it('covers what a simplified notice has to cover', () => {
    const headings = Array.from(el().querySelectorAll('h2')).map((h) => h.textContent?.trim());
    expect(headings).toEqual([
      'Quién lo recibe',
      'Qué recogemos',
      'Para qué',
      'Cuánto tiempo',
      'Cómo lo borras',
      'Cookies',
      'Cambios',
    ]);
  });

  it('tells the visitor how current it is', () => {
    expect(el().querySelector('.privacy__updated')!.textContent).toContain(
      SITE_INFO.privacyUpdatedAt,
    );
  });
});
