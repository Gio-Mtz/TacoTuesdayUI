import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { routes } from '../app.routes';
import { Landing } from './landing';

describe('Landing', () => {
  let fixture: ComponentFixture<Landing>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Landing],
      providers: [provideRouter(routes)],
    }).compileComponents();

    fixture = TestBed.createComponent(Landing);
    await fixture.whenStable();
  });

  // Navigates first and renders afterwards, which is the order a visitor
  // arrives in when they paste a link or click a hero door.
  async function openWith(url: string): Promise<HTMLElement> {
    await TestBed.inject(Router).navigateByUrl(url);

    const routed = TestBed.createComponent(Landing);
    await routed.whenStable();

    return routed.nativeElement as HTMLElement;
  }

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('tells the whole argument in five sections', () => {
    expect(el().querySelectorAll('section').length).toBe(5);
  });

  it('keeps the order of the argument: what it is, who pays, who shows up, how, the ask', () => {
    const ids = Array.from(el().querySelectorAll('section')).map((s) => s.id);
    expect(ids).toEqual(['', 'companies', 'engineers', 'how-it-works', 'waitlist']);
  });

  it('puts the only thing that asks for something last', () => {
    const sections = Array.from(el().querySelectorAll('section'));
    expect(sections[sections.length - 1].id).toBe('waitlist');
  });

  it('has exactly one <h1> so the heading outline is valid', () => {
    expect(el().querySelectorAll('h1').length).toBe(1);
  });

  it('opens the form on the company side when nobody said otherwise', () => {
    // The default has to stay what it has always been: the home page leads with
    // "For teams hiring engineers", so a visitor with no parameter is treated
    // as a company, exactly as before US-013.
    const company = el().querySelector<HTMLInputElement>('input[value="company"]');

    expect(company?.checked).toBe(true);
    expect(el().querySelector('#waitlist-company')).not.toBeNull();
  });

  it('opens the form on the ENGINEER side when the engineer door was used (US-013)', async () => {
    const host = await openWith('/?side=candidate');

    expect(host.querySelector<HTMLInputElement>('input[value="candidate"]')?.checked).toBe(true);

    // The point of the card: the engineer is not asked for the name of their
    // company, and the field they DO have is there.
    expect(host.querySelector('#waitlist-company')).toBeNull();
    expect(host.querySelector('#waitlist-role')).not.toBeNull();
  });

  it('still lets the visitor change their mind, unlike /talento', async () => {
    const host = await openWith('/?side=candidate');

    // `lockedKind` removes the chooser. `initialKind` must only move it.
    expect(host.querySelector('fieldset')).not.toBeNull();
    expect(host.querySelectorAll('input[type="radio"]').length).toBe(2);
  });

  it('opens the form on the company side when the door said company', async () => {
    const host = await openWith('/?side=company');

    expect(host.querySelector<HTMLInputElement>('input[value="company"]')?.checked).toBe(true);
    expect(host.querySelector('#waitlist-company')).not.toBeNull();
  });

  it('falls back to the default form on junk instead of breaking the page', async () => {
    const host = await openWith('/?side=engineer');

    expect(host.querySelector<HTMLInputElement>('input[value="company"]')?.checked).toBe(true);
    expect(host.querySelectorAll('section').length).toBe(5);
  });

  it('gives each audience a door where it is persuaded, not only in the hero (US-014)', () => {
    // The card in one assertion, and it is a count as much as a target. Before
    // US-014 the page had exactly TWO doors, both in the hero, above the fold.
    // Everything after it -- the section for companies, the section for
    // engineers, the three steps -- argued and then offered nothing to click,
    // so a visitor convinced by the section written FOR them arrived at the
    // form with the page having forgotten which side they said they were on.
    //
    // Reading the hrefs in DOM order is what catches the copy-paste: the two
    // sections are separate components, so nothing but this test notices if the
    // engineers section ends up carrying the hiring door.
    const doors = Array.from(el().querySelectorAll<HTMLAnchorElement>('a[href*="side="]')).map(
      (a) => a.getAttribute('href'),
    );

    expect(doors).toEqual([
      '/?side=company#waitlist',
      '/?side=candidate#waitlist',
      '/?side=company#waitlist',
      '/?side=candidate#waitlist',
    ]);
  });

  it('puts the engineer door inside the engineer section and the hiring door inside the hiring one (US-014)', () => {
    // Same defect, asked the other way round: the one above would still pass if
    // both sections' doors were right but landed in each other's section.
    expect(
      el().querySelector('#engineers a[href*="side=candidate"]'),
      'the engineers section must own the engineer door',
    ).not.toBeNull();
    expect(el().querySelector('#engineers a[href*="side=company"]')).toBeNull();

    expect(
      el().querySelector('#companies a[href*="side=company"]'),
      'the companies section must own the hiring door',
    ).not.toBeNull();
    expect(el().querySelector('#companies a[href*="side=candidate"]')).toBeNull();
  });
});
