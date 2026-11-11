import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { routes } from '../app.routes';
import { EMPLOYERS_COPY } from '../pages/employers/employers-copy';
import { TALENT_COPY } from '../pages/talent/talent-copy';
import { Landing } from './landing';

describe('Landing', () => {
  let fixture: ComponentFixture<Landing>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Landing],
      providers: [provideRouter(routes)],
    }).compileComponents();

    fixture = TestBed.createComponent(Landing);
    await fixture.whenStable();
  });

  // Navigates first and renders afterwards: the order a visitor arrives in.
  async function openWith(url: string): Promise<HTMLElement> {
    await TestBed.inject(Router).navigateByUrl(url);

    const routed = TestBed.createComponent(Landing);
    await routed.whenStable();

    return routed.nativeElement as HTMLElement;
  }

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('tells the whole argument in five sections', () => {
    expect(el().querySelectorAll('section').length).toBe(5);
  });

  it('keeps the order of the argument: what it is, who pays, who shows up, how, the ask', () => {
    const ids = Array.from(el().querySelectorAll('section')).map((s) => s.id);
    expect(ids).toEqual(['', 'companies', 'engineers', 'how-it-works', 'waitlist']);
  });

  it('puts the only thing that asks for something last', () => {
    const sections = Array.from(el().querySelectorAll('section'));
    expect(sections[sections.length - 1].id).toBe('waitlist');
  });

  it('has exactly one <h1> so the heading outline is valid', () => {
    expect(el().querySelectorAll('h1').length).toBe(1);
  });

  it('opens the form on the company side when nobody said otherwise', () => {
    // No parameter means company: the home page leads with the hiring side.
    const company = el().querySelector<HTMLInputElement>('input[value="company"]');

    expect(company?.checked).toBe(true);
    expect(el().querySelector('#waitlist-company')).not.toBeNull();
  });

  it('opens the form on the ENGINEER side when the engineer door was used (US-013)', async () => {
    const host = await openWith('/?side=candidate');

    expect(host.querySelector<HTMLInputElement>('input[value="candidate"]')?.checked).toBe(true);

    // The engineer is not asked for a company name, and their own field is there.
    expect(host.querySelector('#waitlist-company')).toBeNull();
    expect(host.querySelector('#waitlist-role')).not.toBeNull();
  });

  it('still lets the visitor change their mind, unlike /talento', async () => {
    const host = await openWith('/?side=candidate');

    // `lockedKind` removes the chooser. `initialKind` must only move it.
    expect(host.querySelector('fieldset')).not.toBeNull();
    expect(host.querySelectorAll('input[type="radio"]').length).toBe(2);
  });

  it('opens the form on the company side when the door said company', async () => {
    const host = await openWith('/?side=company');

    expect(host.querySelector<HTMLInputElement>('input[value="company"]')?.checked).toBe(true);
    expect(host.querySelector('#waitlist-company')).not.toBeNull();
  });

  it('falls back to the default form on junk instead of breaking the page', async () => {
    const host = await openWith('/?side=engineer');

    expect(host.querySelector<HTMLInputElement>('input[value="company"]')?.checked).toBe(true);
    expect(host.querySelectorAll('section').length).toBe(5);
  });

  it('gives each audience a door where it is persuaded, not only in the hero (US-014)', () => {
    // A count as much as a target. Reading the hrefs in DOM order is what catches
    // the copy-paste: the sections are separate components, so nothing but this
    // test notices if the engineers section carries the hiring door.
    const doors = Array.from(el().querySelectorAll<HTMLAnchorElement>('a[href*="side="]')).map(
      (a) => a.getAttribute('href'),
    );

    expect(doors).toEqual([
      '/?side=company#waitlist',
      '/?side=candidate#waitlist',
      '/?side=company#waitlist',
      '/?side=candidate#waitlist',
    ]);
  });

  it('puts the engineer door inside the engineer section and the hiring door inside the hiring one (US-014)', () => {
    // The same defect asked in reverse: the test above still passes if the two
    // sections' doors are swapped.
    expect(
      el().querySelector('#engineers a[href*="side=candidate"]'),
      'the engineers section must own the engineer door',
    ).not.toBeNull();
    expect(el().querySelector('#engineers a[href*="side=company"]')).toBeNull();

    expect(
      el().querySelector('#companies a[href*="side=company"]'),
      'the companies section must own the hiring door',
    ).not.toBeNull();
    expect(el().querySelector('#companies a[href*="side=candidate"]')).toBeNull();
  });

  it('reaches both audience pages without the header nav, which a phone never shows (US-028)', () => {
    // Measured before it was written: at 390px the home page reached `/`,
    // `/privacy` and `/talento` only -- `.site-header__nav` is `display: none`
    // below `md` and there is no other menu, so these two pages existed and
    // nothing on a phone could get to them.
    const reachable = new Set(
      Array.from(el().querySelectorAll<HTMLAnchorElement>('a[href]')).map(
        (a) => a.getAttribute('href')!.split(/[?#]/)[0],
      ),
    );

    expect(reachable.has(EMPLOYERS_COPY.en.route)).toBe(true);
    expect(reachable.has(TALENT_COPY.en.route)).toBe(true);
  });

  it('puts each page link inside the section that argued for it (US-028)', () => {
    // The same defect asked in reverse, and the one a copy-paste between twin
    // sections produces: both links present, both in the wrong section.
    expect(el().querySelector(`#companies a[href="${EMPLOYERS_COPY.en.route}"]`)).not.toBeNull();
    expect(el().querySelector(`#companies a[href="${TALENT_COPY.en.route}"]`)).toBeNull();

    expect(el().querySelector(`#engineers a[href="${TALENT_COPY.en.route}"]`)).not.toBeNull();
    expect(el().querySelector(`#engineers a[href="${EMPLOYERS_COPY.en.route}"]`)).toBeNull();
  });

  it('leaves the four side doors exactly as US-014 left them (US-028)', () => {
    // The new links carry no `side=` and no fragment on purpose. This is the
    // guard that says so from the page's side, not the section's.
    const doors = Array.from(el().querySelectorAll<HTMLAnchorElement>('a[href*="side="]')).length;
    const waitlistDoors = Array.from(
      el().querySelectorAll<HTMLAnchorElement>('a[href*="waitlist"]'),
    ).length;

    expect(doors).toBe(4);
    expect(waitlistDoors).toBe(4);
  });
});
