import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { routes } from '../../../app.routes';
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
    const doors = el().querySelectorAll<HTMLAnchorElement>('.companies__actions a');

    expect(doors.length).toBe(1);
    expect(doors[0].getAttribute('href')).toBe('/?side=company#waitlist');
  });
});
