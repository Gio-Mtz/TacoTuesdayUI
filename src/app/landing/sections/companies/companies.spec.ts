import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Companies } from './companies';

describe('Companies', () => {
  let fixture: ComponentFixture<Companies>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Companies] }).compileComponents();
    fixture = TestBed.createComponent(Companies);
    await fixture.whenStable();
  });

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('is the anchor the header and the hero link to', () => {
    expect(el().querySelector('#empresas')).toBeTruthy();
  });

  it('names itself for assistive tech through its own heading', () => {
    const section = el().querySelector('section')!;
    const labelledBy = section.getAttribute('aria-labelledby');
    expect(labelledBy).toBe('empresas-titulo');
    expect(el().querySelector(`#${labelledBy}`)).toBeTruthy();
  });

  it('makes three points, each with a heading under the section heading', () => {
    const cards = el().querySelectorAll('.tt-card');
    expect(cards.length).toBe(3);
    expect(el().querySelectorAll('.tt-card h3').length).toBe(3);
  });
});
