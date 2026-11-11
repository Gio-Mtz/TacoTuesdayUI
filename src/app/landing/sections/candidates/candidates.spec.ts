import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { routes } from '../../../app.routes';
import { TALENT_COPY } from '../../../pages/talent/talent-copy';
import { Candidates } from './candidates';

describe('Candidates', () => {
  let fixture: ComponentFixture<Candidates>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Candidates],
      providers: [provideRouter(routes)],
    }).compileComponents();
    fixture = TestBed.createComponent(Candidates);
    await fixture.whenStable();
  });

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('keeps the stakeholder line word for word', () => {
    const heading = el().querySelector('#engineers-title')!;
    expect(heading.textContent?.trim()).toBe(
      'Tired of recruiters ghosting you? Let them come to you',
    );
  });

  it('is the anchor the header and the hero link to', () => {
    expect(el().querySelector('#engineers')).toBeTruthy();
  });

  it('makes three promises', () => {
    expect(el().querySelectorAll('.tt-card').length).toBe(3);
  });

  it('ends its argument with a door of its own, on the ENGINEER side (US-014)', () => {
    // The whole card in one assertion, and the half that actually bites: this
    // is the section that tells an engineer the product is for them, so its
    // door must not be the company one. `side=company` here would ask that
    // engineer for the name of their employer -- the US-013 defect arriving by
    // another road -- and would tilt `lead_kind` towards companies again.
    const doors = Array.from(
      el().querySelectorAll<HTMLAnchorElement>('.candidates__actions a[href*="waitlist"]'),
    ).map((a) => a.getAttribute('href'));

    expect(doors).toEqual(['/?side=candidate#waitlist']);
    expect(doors[0]).not.toContain('side=company');
  });

  it('also offers the page built for this audience, which the hidden nav drops on a phone (US-028)', () => {
    // Crossed against the talent manifest and not against a literal: the route
    // lives in one file, and a test that retyped it would agree with a page
    // that had moved.
    const out = el().querySelector<HTMLAnchorElement>(
      '.candidates__actions a:not([href*="waitlist"])',
    )!;

    expect(out).not.toBeNull();
    expect(out.getAttribute('href')).toBe(TALENT_COPY.en.route);
  });

  it('sends the engineer to the ENGINEER page, never to the hiring one (US-028)', () => {
    // The half that bites, asked in reverse: the sections are twins, so a
    // copy-paste here would send a convinced engineer to the companies page.
    const out = el().querySelector<HTMLAnchorElement>(
      '.candidates__actions a:not([href*="waitlist"])',
    )!;

    expect(out.getAttribute('href')).toBe(TALENT_COPY.en.route);
    expect(out.getAttribute('href')).not.toBe(TALENT_COPY.en.crossoverRoute);
  });

  it('gives that link no fragment, so the door count stays at one (US-028)', () => {
    const out = el().querySelector<HTMLAnchorElement>(
      '.candidates__actions a:not([href*="waitlist"])',
    )!;

    expect(out.getAttribute('href')).not.toContain('#');
    expect(out.getAttribute('href')).not.toContain('side=');
  });

  it('asks before it explains: the form door comes first (US-028)', () => {
    const hrefs = Array.from(
      el().querySelectorAll<HTMLAnchorElement>('.candidates__actions a'),
    ).map((a) => a.getAttribute('href'));

    expect(hrefs).toEqual(['/?side=candidate#waitlist', TALENT_COPY.en.route]);
  });
});
