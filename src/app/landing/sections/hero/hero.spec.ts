import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { routes } from '../../../app.routes';
import { Hero } from './hero';

describe('Hero', () => {
  let fixture: ComponentFixture<Hero>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Hero],
      // The calls to action are routerLinks, so the router has to exist.
      providers: [provideRouter(routes)],
    }).compileComponents();

    fixture = TestBed.createComponent(Hero);
    await fixture.whenStable();
  });

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('carries the only <h1> on the page', () => {
    const headings = el().querySelectorAll('h1');
    expect(headings.length).toBe(1);
    expect(headings[0].textContent).toContain('nobody left on read');
  });

  it('offers one door per audience', () => {
    const actions = el().querySelectorAll('.hero__actions a');
    expect(actions.length).toBe(2);
    expect(actions[0].textContent?.trim()).toBe("I'm hiring");
    expect(actions[1].textContent?.trim()).toBe("I'm looking for work");
  });

  // A tripwire, not a copy test. Asserting the exact eyebrow string would fail on
  // every wording pass and teach whoever hits it to update the expectation without
  // reading it. What has to survive a wording pass is the DECISION: the line above
  // the <h1> names the audience and makes no geographic claim, because `brand.md`
  // gives the origin to the mark and the palette, and a city in the first line reads
  // as "local agency" to the buyer this page is written for. Nothing else in the repo
  // could see this — the string is plain visible text, so `ng build` has no opinion
  // and, until now, no spec did either.
  //
  // The footer's `Made in Guadalajara, Mexico.` is deliberately NOT covered here: it
  // is a credit line in another component and `site-footer.spec.ts` asserts it.
  it('leads with the audience and does not put the city in the first line', () => {
    const eyebrow = el().querySelector('.tt-eyebrow');

    expect(eyebrow).not.toBeNull();
    const text = eyebrow!.textContent!.trim();

    expect(text.length).toBeGreaterThan(0);
    expect(text).toMatch(/engineer/i);
    for (const place of ['Guadalajara', 'Jalisco', 'Zapopan', 'Mexico', 'México']) {
      expect(text).not.toContain(place);
    }
  });

  it('sends both doors to the waitlist form now that it exists (US-003)', () => {
    // They were pointed at #companies and #engineers while there was no form to
    // send anyone to. The form's first question is which side you are on, so
    // one anchor is enough and asking twice would be worse.
    const hrefs = Array.from(el().querySelectorAll('.hero__actions a')).map((a) =>
      a.getAttribute('href'),
    );
    expect(hrefs).toEqual(['/#waitlist', '/#waitlist']);
  });
});
