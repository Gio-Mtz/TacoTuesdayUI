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
    //
    // ⚠️ US-009 turned it into English, which is a translation of the one line
    // `brand.md` calls "the brand". The Spanish original — "¿Odias que los
    // reclutas te ghosteen? Deja que ellos te busquen" — is the wording that
    // belongs to this audience, and US-010 puts it back, verbatim, on
    // `/talento`. If that ever lands and this assertion still reads English on
    // a page addressed to Mexican devs, one of the two pages is wrong.
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
