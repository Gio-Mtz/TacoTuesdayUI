import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HowItWorks } from './how-it-works';

describe('HowItWorks', () => {
  let fixture: ComponentFixture<HowItWorks>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HowItWorks] }).compileComponents();
    fixture = TestBed.createComponent(HowItWorks);
    await fixture.whenStable();
  });

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('is exactly three steps — the point is that the process is short', () => {
    expect(el().querySelectorAll('.steps__item').length).toBe(3);
  });

  it('uses an ordered list, because the order is the meaning', () => {
    expect(el().querySelector('ol')).toBeTruthy();
  });

  it('numbers the steps from their position, never from the copy', () => {
    const numbers = Array.from(el().querySelectorAll('.steps__number')).map((n) =>
      n.textContent?.trim(),
    );
    expect(numbers).toEqual(['1', '2', '3']);
  });

  it('gives a screen reader the step number too, since the visible one is hidden', () => {
    const spoken = Array.from(el().querySelectorAll('.tt-sr-only')).map((n) => n.textContent?.trim());
    expect(spoken).toEqual(['Paso 1:', 'Paso 2:', 'Paso 3:']);
  });
});
