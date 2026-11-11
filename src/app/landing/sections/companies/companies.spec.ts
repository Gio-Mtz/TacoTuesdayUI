import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { routes } from '../../../app.routes';
import { EMPLOYERS_COPY } from '../../../pages/employers/employers-copy';
import { Companies } from './companies';

describe('Companies', () => {
  let fixture: ComponentFixture<Companies>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Companies],
      providers: [provideRouter(routes)],
    }).compileComponents();
    fixture = TestBed.createComponent(Companies);
    await fixture.whenStable();
  });

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('is the anchor the header and the hero link to', () => {
    expect(el().querySelector('#companies')).toBeTruthy();
  });

  it('names itself for assistive tech through its own heading', () => {
    const section = el().querySelector('section')!;
    const labelledBy = section.getAttribute('aria-labelledby');
    expect(labelledBy).toBe('companies-title');
    expect(el().querySelector(`#${labelledBy}`)).toBeTruthy();
  });

  it('makes three points, each with a heading under the section heading', () => {
    const cards = el().querySelectorAll('.tt-card');
    expect(cards.length).toBe(3);
    expect(el().querySelectorAll('.tt-card h3').length).toBe(3);
  });

  it('ends its argument with a door of its own, on the COMPANY side (US-014)', () => {
    // Before US-014 this section had no link at all: a hiring manager who was
    // convinced right here had to scroll back to the hero or keep going to a
    // form that had already forgotten which audience they were.
    const doors = Array.from(
      el().querySelectorAll<HTMLAnchorElement>('.companies__actions a[href*="waitlist"]'),
    ).map((a) => a.getAttribute('href'));

    expect(doors).toEqual(['/?side=company#waitlist']);
  });

  it('also offers the page built for this audience, which the hidden nav drops on a phone (US-028)', () => {
    // Crossed against the employers manifest and not against a literal: the
    // route lives in one file, and a test that retyped it would agree with a
    // page that had moved.
    const out = el().querySelector<HTMLAnchorElement>(
      '.companies__actions a:not([href*="waitlist"])',
    )!;

    expect(out).not.toBeNull();
    expect(out.getAttribute('href')).toBe(EMPLOYERS_COPY.en.route);
  });

  it('gives that link no fragment, so the door count stays at one (US-028)', () => {
    // `/companies#waitlist` would match the `a[href*="waitlist"]` count that
    // keeps one door per section -- the same trap US-026 walked around.
    const out = el().querySelector<HTMLAnchorElement>(
      '.companies__actions a:not([href*="waitlist"])',
    )!;

    expect(out.getAttribute('href')).not.toContain('#');
    expect(out.getAttribute('href')).not.toContain('side=');
  });

  it('asks before it explains: the form door comes first (US-028)', () => {
    const hrefs = Array.from(el().querySelectorAll<HTMLAnchorElement>('.companies__actions a')).map(
      (a) => a.getAttribute('href'),
    );

    expect(hrefs).toEqual(['/?side=company#waitlist', EMPLOYERS_COPY.en.route]);
  });
});
