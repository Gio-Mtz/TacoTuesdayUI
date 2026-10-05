import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { routes } from '../../../app.routes';
import { Hero } from './hero';

describe('Hero', () => {
  let fixture: ComponentFixture<Hero>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Hero],

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
    const hrefs = Array.from(el().querySelectorAll('.hero__actions a')).map((a) =>
      a.getAttribute('href'),
    );
    expect(hrefs).toEqual(['/#waitlist', '/#waitlist']);
  });
});
