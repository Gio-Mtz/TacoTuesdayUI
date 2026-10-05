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
});
