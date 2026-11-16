import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { routes } from '../../app.routes';
import { PRIVACY_CARDS, privacyRoute } from '../../core/i18n/language-switch';
import { PageLang, PageLangService } from '../../core/i18n/page-lang';
import { SOCIAL_CARDS } from '../../core/seo/page-social';
import { SITE_INFO } from '../../core/site/site-info';
import { SHELL_COPY } from '../../core/i18n/shell-copy';
import { WAITLIST_COPY } from '../../landing/sections/waitlist/waitlist-copy';
import { EMPLOYERS_COPY } from '../employers/employers-copy';
import { TALENT_COPY } from './talent-copy';
import { askedFieldLabels, askedFieldsPhrase } from '../../landing/sections/waitlist/asked-fields';
import { Talent } from './talent';

// One component serves `/engineers` and `/talento`, so every structural claim is
// made against BOTH languages: a page that only holds together in Spanish is
// the bug US-024 exists to prevent.
const INVENTED_FIELD_WORDINGS: readonly string[] = [
  'what you are working on',
  'en qu\u00e9 andas',
  'what you do',
  'a qu\u00e9 te dedicas',
  'what you build',
  'qu\u00e9 construyes',
  'tu puesto y',
  'your company name',
  'el nombre de tu empresa',
  'el nombre de la empresa',
];

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

  it('renders all four section anchors of this language', () => {
    const wanted = [copy.heroId, copy.stepsId, copy.faqId, copy.waitlistId];

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

  it('answers every question it raises, as a pair a screen reader can follow (US-025)', () => {
    const list = host().querySelector(`#${copy.faqId} dl`)!;
    const questions = Array.from(list.querySelectorAll('dt')).map((dt) => dt.textContent?.trim());
    const answers = Array.from(list.querySelectorAll('dd')).map((dd) => dd.textContent?.trim());

    expect(questions).toEqual(copy.faq.map((item) => item.question));
    expect(questions.length).toBe(answers.length);

    // The answer that names the form's fields is rendered as its copy plus the
    // derived list, so this measures the pairing and the lede. That the list
    // agrees with the form is measured in `asked-fields.spec.ts`, which mounts
    // the form and reads the labels it renders.
    copy.faq.forEach((item, i) => {
      if (item.asksFields) {
        expect(answers[i]).toMatch(
          new RegExp(`^${item.answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} .+\\.$`),
        );
      } else if (item.answerAfter) {
        // US-033: cut around the address, so the pair is the lede, the address
        // and the rest. That the address is the one the site owns is measured
        // below, against `SITE_INFO`.
        expect(answers[i]?.replace(/\s+/g, ' ')).toBe(
          `${item.answer} ${SITE_INFO.contactEmail} ${item.answerAfter}`,
        );
      } else {
        expect(answers[i]).toBe(item.answer);
      }
    });
  });

  // US-032. Every surface here that names the form's fields now reads them from
  // the form. The wordings below are the eight this page and its sibling used to
  // carry by hand, one of them for a field the form has never had.
  it('names the fields its OWN form asks for where the steps end (US-032)', () => {
    const step = copy.steps.find((item) => item.asksFields)!;
    const rendered = Array.from(host().querySelectorAll('.tt-card__body'))
      .map((node) => (node.textContent ?? '').replace(/\s+/g, ' ').trim())
      .find((body) => body.startsWith(step.body))!;

    expect(rendered).toBe(`${step.body} ${askedFieldsPhrase(lang, 'candidate')}.`);
    for (const label of askedFieldLabels(lang, 'candidate')) {
      expect(rendered).toContain(label);
    }
  });

  it('tells a dev in the PROSE that the role field may be left blank (US-032)', () => {
    // Measured on the step card, not on the page: the form is rendered further
    // down and carries its own marker, so `text()` would pass this whether the
    // prose said it or not.
    const step = copy.steps.find((item) => item.asksFields)!;
    const rendered = Array.from(host().querySelectorAll('.tt-card__body'))
      .map((node) => (node.textContent ?? '').replace(/\s+/g, ' ').trim())
      .find((body) => body.startsWith(step.body))!;

    expect(rendered).toContain(WAITLIST_COPY[lang].labelRole);
    expect(rendered).toContain(WAITLIST_COPY[lang].roleOptional);
  });

  it('names the COMPANY fields in the exit, not its own (US-032)', () => {
    const body = host()
      .querySelector('.talent-crossover__body')!
      .textContent!.replace(/\s+/g, ' ')
      .trim();

    expect(body).toBe(`${copy.crossoverBody} ${askedFieldsPhrase(lang, 'company')}.`);
    expect(body).toContain(WAITLIST_COPY[lang].labelCompany);
    expect(body).not.toContain(WAITLIST_COPY[lang].labelRole);
  });

  it('writes no field of the form by hand, in either language (US-032)', () => {
    const page = text().toLowerCase();
    for (const wording of INVENTED_FIELD_WORDINGS) {
      expect(page).not.toContain(wording);
    }
  });

  // US-033. Four surfaces send a reader to the same address: the footer, the two
  // places the notice names it, and this answer. The first three read it from
  // `SITE_INFO`; this one promised the mechanism and handed over nothing.
  it('hands the deletion answer the address it tells you to write to (US-033)', () => {
    const i = copy.faq.findIndex((item) => item.answerAfter);
    const answer = Array.from(host().querySelectorAll(`#${copy.faqId} dd`))[i];

    // Scoped to the ANSWER, not to the page: the footer renders this same
    // address on every route, so a page-wide `text()` here would pass whatever
    // this answer said. That is #147, and it is the trap this test is shaped
    // against.
    const link = answer.querySelector<HTMLAnchorElement>('a')!;

    expect(link.getAttribute('href')).toBe(`mailto:${SITE_INFO.contactEmail}`);
    expect(link.textContent?.trim()).toBe(SITE_INFO.contactEmail);
    expect(answer.textContent).toContain(SITE_INFO.contactEmail);
  });

  it('writes no address by hand in the prose of this page (US-033)', () => {
    // The regression: anybody can retype the address into the answer and it
    // would read correctly for exactly as long as the address does not change.
    const written = JSON.stringify(copy);

    expect(written).not.toContain('@');
    expect(text()).toContain(SITE_INFO.contactEmail);
  });

  it('cuts exactly one answer around the address, and it is the deletion one (US-033)', () => {
    const cut = copy.faq.filter((item) => item.answerAfter);

    expect(cut.length).toBe(1);
    // The answer stops mid-sentence on purpose, so neither half may end in a
    // full stop: that is what tells a reviewer the address belongs between them.
    expect(cut[0].answer.endsWith('.')).toBe(false);
    expect(cut[0].answerAfter!.startsWith('.')).toBe(false);
  });

  it('sends the privacy link to the notice of ITS OWN language (US-025)', () => {
    // The whole point of reading the route from the manifest. An English reader
    // asking how to delete their data must not land on the Spanish notice.
    // Scoped to the note since US-033: the deletion answer now carries a
    // `mailto:` anchor, which comes first in document order inside this section.
    const link = host().querySelector<HTMLAnchorElement>('.talent-faq__note a')!;

    expect(link.getAttribute('href')).toBe(privacyRoute(lang));
    expect(SOCIAL_CARDS[PRIVACY_CARDS[lang]].lang).toBe(lang);
  });

  it('puts no door in the questions, because the form is the next thing on the page (US-025)', () => {
    // Deliberate, and the reason it is written down: every other section that
    // argues ends in a door, but this one ends two hundred pixels above a real
    // email field, so a door here would scroll to something already in view.
    const doors = host().querySelectorAll(`#${copy.faqId} a[href*="${copy.waitlistId}"]`);

    expect(doors.length).toBe(0);
    expect(host().querySelector(`#${copy.faqId} .talent__actions`)).toBeNull();
  });

  it('says who pays NOTHING, because the site has never said it (US-025)', () => {
    // The guard on an OPEN product question. The site promises "always free for
    // engineers" and no page says who covers it; answering that here would make
    // a pricing commitment the stakeholder has not made. Asked 16-oct, still open.
    const faq = host().querySelector(`#${copy.faqId}`)!.textContent ?? '';
    const invented = [
      'company pays',
      'companies pay',
      'the company is the one paying',
      'paid by the company',
      'la empresa paga',
      'las empresas pagan',
      'quien paga',
      'lo paga la empresa',
    ].filter((phrase) => faq.toLowerCase().includes(phrase));

    expect(invented, `the FAQ answered the open pricing question: ${invented}`).toEqual([]);
  });

  it('sends the other audience out to the companies page of ITS OWN language (US-026)', () => {
    const out = host().querySelector<HTMLAnchorElement>('.talent-crossover a')!;

    expect(out.getAttribute('href')).toBe(copy.crossoverRoute);
    expect(out.textContent?.trim()).toBe(copy.crossoverCta);
  });

  it('exits without a fragment, so the exit is not counted as a door (US-026)', () => {
    // `/companies#waitlist` would match the `a[href*="waitlist"]` count that
    // keeps one door per section, and would land the wrong audience on a form
    // instead of on the argument written for them.
    const out = host().querySelector<HTMLAnchorElement>('.talent-crossover a')!;

    expect(out.getAttribute('href')).not.toContain('#');
  });

  it('keeps the exit a band, not a section — TD-040 on this side too (US-026)', () => {
    const crossover = host().querySelector('.talent-crossover')!;

    expect(crossover.classList.contains('tt-section')).toBe(false);
    expect(crossover.querySelector('.talent-crossover__panel')).toBeTruthy();
  });

  it('puts the exit before the questions, which are written for whoever stays (US-026)', () => {
    const sections = Array.from(host().querySelectorAll('section'));
    const crossover = sections.findIndex((el) => el.classList.contains('talent-crossover'));
    const faq = sections.findIndex((el) => el.id === copy.faqId);

    expect(crossover).toBeGreaterThan(-1);
    expect(faq).toBeGreaterThan(crossover);
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

  it('asks the same questions in both languages, and answers all of them (US-025)', () => {
    const en = TALENT_COPY.en;
    const es = TALENT_COPY['es-MX'];

    expect(en.faq.length).toBe(es.faq.length);
    expect(en.faq.length).toBeGreaterThan(0);
    for (const side of [en.faq, es.faq]) {
      expect(side.filter((item) => !item.question.trim() || !item.answer.trim())).toEqual([]);
    }
    expect(new Set([en.faqId, es.faqId]).size).toBe(2);
  });

  it('makes the exit between the two audiences reciprocal, in each language (US-026)', () => {
    // The asymmetry US-026 closes: the companies page had carried this exit
    // since it was written, and the engineer page had none. A pair that stops
    // being reciprocal is the bug, so both directions are asserted together.
    for (const lang of ['en', 'es-MX'] as const) {
      expect(TALENT_COPY[lang].crossoverRoute).toBe(EMPLOYERS_COPY[lang].route);
      expect(EMPLOYERS_COPY[lang].crossoverRoute).toBe(TALENT_COPY[lang].route);
    }

    expect(new Set([TALENT_COPY.en.crossoverRoute, TALENT_COPY['es-MX'].crossoverRoute]).size).toBe(
      2,
    );
  });
});
