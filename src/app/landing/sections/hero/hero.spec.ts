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
    expect(headings[0].textContent).toContain('sin silencios');
  });

  it('offers one door per audience', () => {
    const actions = el().querySelectorAll('.hero__actions a');
    expect(actions.length).toBe(2);
    expect(actions[0].textContent?.trim()).toBe('Estoy contratando');
    expect(actions[1].textContent?.trim()).toBe('Busco trabajo');
  });

  it('sends each door to its own section instead of a form that does not exist yet', () => {
    const hrefs = Array.from(el().querySelectorAll('.hero__actions a')).map((a) =>
      a.getAttribute('href'),
    );
    expect(hrefs).toEqual(['/#empresas', '/#candidatos']);
  });
});
