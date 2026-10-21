import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { routes } from '../../app.routes';
import { PageLang, PageLangService } from '../../core/i18n/page-lang';
import { SHELL_COPY } from '../../core/i18n/shell-copy';
import { WAITLIST_COPY } from '../../landing/sections/waitlist/waitlist-copy';
import { TALENT_COPY } from './talent-copy';
import { Talent } from './talent';

// One component serves `/engineers` and `/talento`, so every structural claim is
// made against BOTH languages: a page that only holds together in Spanish is
// the bug US-024 exists to prevent.
describe.each<PageLang>(['en', 'es-MX'])('Talent in %s', (lang) => {
  const copy = TALENT_COPY[lang];

  let fixture: ComponentFixture<Talent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Talent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter(routes)],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);

    TestBed.inject(PageLangService).set(lang);

    fixture = TestBed.createComponent(Talent);
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const text = (): string => host().textContent ?? '';

  it('leads with the engineer-side promise in the h1, in this language', () => {
    const line = host().querySelector('h1')!.textContent!.replace(/\s+/g, ' ').trim();

    expect(line).toBe(`${copy.heroTitleTop} ${copy.heroTitleBottom}`);
  });

  it('has exactly one h1', () => {
    expect(host().querySelectorAll('h1').length).toBe(1);
  });

  it('renders all three section anchors of this language', () => {
    const wanted = [copy.heroId, copy.stepsId, copy.waitlistId];

    expect(wanted.filter((id) => !host().querySelector(`#${id}`))).toEqual([]);
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
    expect(host().querySelector(`#${copy.stepsId} [aria-hidden="true"] + span`)).toBeNull();
  });

  it('orders the steps in a list that says the order is the meaning', () => {
    expect(host().querySelector(`#${copy.stepsId} ol`)).toBeTruthy();
  });

  it('embeds the shared form pinned to the engineer, in this language', () => {
    const form = host().querySelector(`#${copy.waitlistId}`)!;

    expect(form.querySelector('fieldset')).toBeNull();
    expect(form.querySelector('#waitlist-role')).toBeTruthy();
    expect(form.querySelector('#waitlist-company')).toBeNull();
    expect(text()).toContain(WAITLIST_COPY[lang].submit);
  });

  it('sends its own call to action to its own form', () => {
    const cta = host().querySelector('.talent-hero__actions a')!;

    expect(cta.getAttribute('href')).toBe(`${copy.route}#${copy.waitlistId}`);
  });

  it('gives every section that argues its own door, and none of them to the other page (US-015)', () => {
    // A count as much as a target. Reading the hrefs in DOM order is what keeps a
    // door where each argument ends instead of piling them up in one place.
    const doors = Array.from(
      host().querySelectorAll<HTMLAnchorElement>(`a[href*="${copy.waitlistId}"]`),
    ).map((a) => a.getAttribute('href'));

    const own = `${copy.route}#${copy.waitlistId}`;
    expect(doors).toEqual([own, own, own]);
  });

  it('puts one door at the end of each section that argues, and labels them apart (US-015)', () => {
    const sectionDoor = (selector: string): HTMLAnchorElement | null =>
      host().querySelector<HTMLAnchorElement>(`${selector} .talent__actions a`);

    const value = sectionDoor('section[aria-labelledby="talent-value-title"]');
    const steps = sectionDoor(`#${copy.stepsId}`);

    expect(value?.textContent?.trim()).toBe(copy.valueCta);
    expect(steps?.textContent?.trim()).toBe(copy.stepsCta);
  });

  it('opens no door through the side query parameter, because this form has no sides (US-015)', () => {
    // The copy-paste guard. On `/` a section door carries `?side=`; here the form
    // is `lockedKind="candidate"` and renders no fieldset, so a `side=` parameter
    // would be one nothing reads and would imply this form has two sides.
    expect(host().querySelectorAll('a[href*="side="]').length).toBe(0);
  });
});

describe('Talent across the two languages', () => {
  const render = async (
    lang: PageLang,
  ): Promise<[ComponentFixture<Talent>, HttpTestingController]> => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [Talent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter(routes)],
    }).compileComponents();

    const http = TestBed.inject(HttpTestingController);
    TestBed.inject(PageLangService).set(lang);

    const fixture = TestBed.createComponent(Talent);
    await fixture.whenStable();

    return [fixture, http];
  };

  it("carries the stakeholder's line verbatim, in the Spanish h1", async () => {
    const [fixture, http] = await render('es-MX');
    const heading = (fixture.nativeElement as HTMLElement).querySelector('h1')!;
    const line = heading.textContent!.replace(/\s+/g, ' ').trim();

    expect(line).toBe('¿Odias que los reclutas te ghosteen? Deja que ellos te busquen');
    http.verify();
  });

  it('says nothing in the other language anywhere a visitor can read it', async () => {
    for (const lang of ['en', 'es-MX'] as const) {
      const other: PageLang = lang === 'en' ? 'es-MX' : 'en';
      const [fixture, http] = await render(lang);

      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      const leaked = [
        TALENT_COPY[other].heroTitleTop,
        TALENT_COPY[other].heroCta,
        TALENT_COPY[other].stepsEyebrow,
        WAITLIST_COPY[other].submit,
      ].filter((phrase) => text.includes(phrase));

      expect(leaked, `${lang} page leaked ${other}`).toEqual([]);
      http.verify();
    }
  });

  it('gives each language its own route and ids', () => {
    const en = TALENT_COPY.en;
    const es = TALENT_COPY['es-MX'];

    expect(new Set([en.route, es.route]).size).toBe(2);
    expect(new Set([en.heroId, es.heroId]).size).toBe(2);
    expect(new Set([en.stepsId, es.stepsId]).size).toBe(2);
    expect(new Set([en.waitlistId, es.waitlistId]).size).toBe(2);
  });

  it('keeps the two languages the same page, card for card', () => {
    const en = TALENT_COPY.en;
    const es = TALENT_COPY['es-MX'];

    expect(en.points.length).toBe(es.points.length);
    expect(en.steps.length).toBe(es.steps.length);
    expect(en.points.map((p) => p.icon)).toEqual(es.points.map((p) => p.icon));
    expect(en.steps.map((s) => s.icon)).toEqual(es.steps.map((s) => s.icon));
  });
});
