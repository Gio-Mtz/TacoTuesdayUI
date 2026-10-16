import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { routes } from '../../app.routes';
import { PageLang, PageLangService } from '../../core/i18n/page-lang';
import { SHELL_COPY } from '../../core/i18n/shell-copy';
import { WAITLIST_COPY } from '../../landing/sections/waitlist/waitlist-copy';
import { EMPLOYERS_COPY } from './employers-copy';
import { Employers } from './employers';

// One component serves `/companies` and `/empresas`, so every structural claim
// is made against BOTH languages: a page that only holds together in Spanish is
// the bug US-022 exists to prevent.
describe.each<PageLang>(['en', 'es-MX'])('Employers in %s', (lang) => {
  const copy = EMPLOYERS_COPY[lang];

  let fixture: ComponentFixture<Employers>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Employers],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter(routes)],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);

    TestBed.inject(PageLangService).set(lang);

    fixture = TestBed.createComponent(Employers);
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const text = (): string => host().textContent ?? '';

  it('leads with the company-side promise in the h1, in this language', () => {
    const line = host().querySelector('h1')!.textContent!.replace(/\s+/g, ' ').trim();

    expect(line).toBe(`${copy.heroTitleTop} ${copy.heroTitleBottom}`);
  });

  it('has exactly one h1', () => {
    expect(host().querySelectorAll('h1').length).toBe(1);
  });

  it('provides every anchor the header nav of this language points at this page', () => {
    const wanted = SHELL_COPY[lang].nav
      .filter((link) => link.path === copy.route)
      .map((link) => link.fragment);

    expect(wanted.length).toBeGreaterThan(0);
    expect(wanted.filter((id) => !host().querySelector(`#${id}`))).toEqual([]);
  });

  it('labels every section for a screen reader', () => {
    const sections = Array.from(host().querySelectorAll('section'));
    const unlabelled = sections.filter(
      (section) => !section.getAttribute('aria-labelledby') && !section.getAttribute('aria-label'),
    );

    expect(unlabelled.length).toBe(0);
  });

  it('numbers the steps as real text, not as a hidden decoration', () => {
    const steps = Array.from(host().querySelectorAll(`#${copy.stepsId} .tt-card__title`));

    expect(steps.length).toBe(3);
    expect(steps.map((h) => h.textContent?.trim().slice(0, 2))).toEqual(['1.', '2.', '3.']);
  });

  it('orders the steps in a list that says the order is the meaning', () => {
    expect(host().querySelector(`#${copy.stepsId} ol`)).toBeTruthy();
  });

  it('embeds the shared form pinned to the company side, in this language', () => {
    const form = host().querySelector(`#${copy.waitlistId}`)!;

    // The whole point of the page: no chooser to get wrong, and the field a
    // hiring team has to fill is the one that is rendered.
    expect(form.querySelector('fieldset')).toBeNull();
    expect(form.querySelector('#waitlist-company')).toBeTruthy();
    expect(form.querySelector('#waitlist-role')).toBeNull();
    expect(text()).toContain(WAITLIST_COPY[lang].submit);
  });

  it('sends its own call to action to its own form', () => {
    const cta = host().querySelector('.employers-hero__actions a')!;

    expect(cta.getAttribute('href')).toBe(`${copy.route}#${copy.waitlistId}`);
  });

  it('gives every section that argues its own door, and none of them to the other page', () => {
    const doors = Array.from(
      host().querySelectorAll<HTMLAnchorElement>(`a[href*="${copy.waitlistId}"]`),
    ).map((a) => a.getAttribute('href'));

    const own = `${copy.route}#${copy.waitlistId}`;
    expect(doors).toEqual([own, own, own]);
  });

  it('opens no door through the side query parameter, because this form has no sides', () => {
    expect(host().querySelectorAll('a[href*="side="]').length).toBe(0);
  });

  it('sends the other audience to the page whose form asks what they can answer', () => {
    const out = host().querySelector<HTMLAnchorElement>('.employers-crossover a')!;
    const expected = copy.crossoverFragment
      ? `${copy.crossoverRoute}#${copy.crossoverFragment}`
      : copy.crossoverRoute;

    expect(out.getAttribute('href')).toBe(expected);
  });

  it('keeps the exit out of the form a band, not a section — TD-040', () => {
    const crossover = host().querySelector('.employers-crossover')!;

    // A full `tt-section` here stacked its padding with the form's own: two
    // times space(9) of empty page, on one colour, right where the visitor was
    // being sent to the form.
    expect(crossover.classList.contains('tt-section')).toBe(false);
    expect(crossover.querySelector('.employers-crossover__panel')).toBeTruthy();
  });
});

describe('Employers across the two languages', () => {
  it('says nothing in the other language anywhere a visitor can read it', async () => {
    for (const lang of ['en', 'es-MX'] as const) {
      const other: PageLang = lang === 'en' ? 'es-MX' : 'en';

      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [Employers],
        providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter(routes)],
      }).compileComponents();

      const http = TestBed.inject(HttpTestingController);
      TestBed.inject(PageLangService).set(lang);

      const fixture = TestBed.createComponent(Employers);
      await fixture.whenStable();

      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      const leaked = [
        EMPLOYERS_COPY[other].heroTitleTop,
        EMPLOYERS_COPY[other].heroCta,
        EMPLOYERS_COPY[other].stepsEyebrow,
        WAITLIST_COPY[other].submit,
      ].filter((phrase) => text.includes(phrase));

      expect(leaked, `${lang} page leaked ${other}`).toEqual([]);
      http.verify();
    }
  });

  it('gives each language its own route, ids and exit', () => {
    const en = EMPLOYERS_COPY.en;
    const es = EMPLOYERS_COPY['es-MX'];

    expect(new Set([en.route, es.route]).size).toBe(2);
    expect(new Set([en.heroId, es.heroId]).size).toBe(2);
    expect(new Set([en.stepsId, es.stepsId]).size).toBe(2);
    expect(new Set([en.waitlistId, es.waitlistId]).size).toBe(2);
  });

  it('keeps the two languages the same page, card for card', () => {
    const en = EMPLOYERS_COPY.en;
    const es = EMPLOYERS_COPY['es-MX'];

    expect(en.points.length).toBe(es.points.length);
    expect(en.steps.length).toBe(es.steps.length);
    expect(en.points.map((p) => p.icon)).toEqual(es.points.map((p) => p.icon));
    expect(en.steps.map((s) => s.icon)).toEqual(es.steps.map((s) => s.icon));
  });
});
