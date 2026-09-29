import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Candidates } from './candidates';

describe('Candidates', () => {
  let fixture: ComponentFixture<Candidates>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Candidates] }).compileComponents();
    fixture = TestBed.createComponent(Candidates);
    await fixture.whenStable();
  });

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('keeps the stakeholder line word for word', () => {
    // This assertion exists so a future copy edit has to be a deliberate one:
    // the sentence is the pitch to this audience, straight from the backlog.
    const heading = el().querySelector('#candidatos-titulo')!;
    expect(heading.textContent?.trim()).toBe(
      '¿Odias que los reclutas te ghosteen? Deja que ellos te busquen',
    );
  });

  it('is the anchor the header and the hero link to', () => {
    expect(el().querySelector('#candidatos')).toBeTruthy();
  });

  it('makes three promises', () => {
    expect(el().querySelectorAll('.tt-card').length).toBe(3);
  });
});
