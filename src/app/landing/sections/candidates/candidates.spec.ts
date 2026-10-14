import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { routes } from '../../../app.routes';
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
    const doors = el().querySelectorAll<HTMLAnchorElement>('.candidates__actions a');

    expect(doors.length).toBe(1);
    expect(doors[0].getAttribute('href')).toBe('/?side=candidate#waitlist');
    expect(doors[0].getAttribute('href')).not.toContain('side=company');
  });
});
