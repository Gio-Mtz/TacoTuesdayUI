import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { routes } from '../../app.routes';
import { PageLangService } from '../../core/i18n/page-lang';
import { WAITLIST_COPY } from '../../landing/sections/waitlist/waitlist-copy';
import { Talent } from './talent';

/**
 * `/talento` — the Spanish page for the engineer.
 *
 * The assertions worth having here are not "the text is on the page": they are
 * the three things that would silently stop being true. The brand line is the
 * stakeholder's own sentence and must survive verbatim. The anchors the header
 * links to have to exist, or three nav links scroll to nothing. And the shared
 * form has to arrive pinned and in Spanish, which is wiring, not copy.
 */
describe('Talent', () => {
  let fixture: ComponentFixture<Talent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Talent],
      providers: [
        provideHttpClient(),
        // The page embeds the waitlist form, which has a real HttpClient
        // dependency. Without this the child fires a request at the backend.
        provideHttpClientTesting(),
        provideRouter(routes),
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);

    // What `PageHeadStrategy` does when the router resolves this route. The page
    // declares `lang: 'es-MX'`; `app.routes.spec.ts` guards that it still does.
    TestBed.inject(PageLangService).set('es-MX');

    fixture = TestBed.createComponent(Talent);
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const text = (): string => host().textContent ?? '';

  it("carries the stakeholder's line verbatim, in the h1", () => {
    // ⚠️ Not paraphrasable. `brand.md` calls this "the brand", and `/` already
    // ships a translated version of it, which is the loss this page exists to
    // undo. Whitespace is collapsed because the template wraps it over two lines
    // with a <br> in the middle; the words are compared exactly.
    const heading = host().querySelector('h1')!;
    const line = heading.textContent!.replace(/\s+/g, ' ').trim();

    expect(line).toBe('¿Odias que los reclutas te ghosteen? Deja que ellos te busquen');
  });

  it('has exactly one h1, and it is the brand line', () => {
    expect(host().querySelectorAll('h1').length).toBe(1);
  });

  it('provides every anchor the Spanish header nav points at', () => {
    // The three fragments in `SHELL_COPY['es-MX'].nav`. A rename on either side
    // leaves a nav link that navigates and sits still — and nothing else in the
    // build can see that.
    // Collected and compared as a list rather than asserted in a loop, so a
    // failure names the missing id instead of saying "expected null to be truthy".
    const wanted = ['para-devs', 'como-funciona', 'lista-de-espera'];
    const missing = wanted.filter((id) => !host().querySelector(`#${id}`));

    expect(missing).toEqual([]);
  });

  it('labels every section for a screen reader', () => {
    const sections = Array.from(host().querySelectorAll('section'));
    const unlabelled = sections.filter(
      (section) => !section.getAttribute('aria-labelledby') && !section.getAttribute('aria-label'),
    );
    expect(unlabelled.length).toBe(0);
  });

  it('numbers the steps as real text, not as a hidden decoration', () => {
    // Deliberately different from `/`, where the number is a large ghosted span
    // marked aria-hidden with "Step N:" repeated for screen readers — TD-008
    // measured that at 1.88:1. Here the number is inside the heading, so it
    // inherits the title colour and there is nothing to hide.
    const steps = Array.from(host().querySelectorAll('#como-funciona .tt-card__title'));

    expect(steps.length).toBe(3);
    expect(steps.map((h) => h.textContent?.trim().slice(0, 2))).toEqual(['1.', '2.', '3.']);
    expect(host().querySelector('#como-funciona [aria-hidden="true"] + span')).toBeNull();
  });

  it('orders the steps in a list that says the order is the meaning', () => {
    expect(host().querySelector('#como-funciona ol')).toBeTruthy();
  });

  it('embeds the shared form, pinned to the engineer and in Spanish', () => {
    const form = host().querySelector('#lista-de-espera')!;

    expect(form.querySelector('fieldset')).toBeNull();
    expect(form.querySelector('#waitlist-role')).toBeTruthy();
    expect(form.querySelector('#waitlist-company')).toBeNull();
    expect(text()).toContain(WAITLIST_COPY['es-MX'].submit);
  });

  it('sends its own call to action to its own form', () => {
    // Not `/#waitlist`: a Spanish page whose only button leaves for the English
    // landing is the bug a cross-page fragment makes easy.
    const cta = host().querySelector('.talent-hero__actions a')!;
    expect(cta.getAttribute('href')).toBe('/talento#lista-de-espera');
  });

  it('says nothing in English anywhere a visitor can read it', () => {
    // The page is one audience in one language. A leftover English string would
    // most likely come from the shared form falling back to `en`.
    const english = [
      WAITLIST_COPY.en.title,
      WAITLIST_COPY.en.submit,
      WAITLIST_COPY.en.labelEmail,
      'How it works',
    ];

    const leaked = english.filter((phrase) => text().includes(phrase));

    expect(leaked).toEqual([]);
  });
});
