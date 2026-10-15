import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { routes } from '../../app.routes';
import { PageLangService } from '../../core/i18n/page-lang';
import { WAITLIST_COPY } from '../../landing/sections/waitlist/waitlist-copy';
import { Talent } from './talent';

describe('Talent', () => {
  let fixture: ComponentFixture<Talent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Talent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter(routes)],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);

    TestBed.inject(PageLangService).set('es-MX');

    fixture = TestBed.createComponent(Talent);
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const text = (): string => host().textContent ?? '';

  it("carries the stakeholder's line verbatim, in the h1", () => {
    const heading = host().querySelector('h1')!;
    const line = heading.textContent!.replace(/\s+/g, ' ').trim();

    expect(line).toBe('¿Odias que los reclutas te ghosteen? Deja que ellos te busquen');
  });

  it('has exactly one h1, and it is the brand line', () => {
    expect(host().querySelectorAll('h1').length).toBe(1);
  });

  it('provides every anchor the Spanish header nav points at', () => {
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
    const cta = host().querySelector('.talent-hero__actions a')!;
    expect(cta.getAttribute('href')).toBe('/talento#lista-de-espera');
  });

  it('gives every section that argues its own door, not only the hero (US-015)', () => {
    // A count as much as a target. Reading the hrefs in DOM order is what keeps a
    // door where each argument ends instead of piling them up in one place.
    const doors = Array.from(
      host().querySelectorAll<HTMLAnchorElement>('a[href*="lista-de-espera"]'),
    ).map((a) => a.getAttribute('href'));

    expect(doors).toEqual([
      '/talento#lista-de-espera',
      '/talento#lista-de-espera',
      '/talento#lista-de-espera',
    ]);
  });

  it('puts one door at the end of each section that argues, and labels them apart (US-015)', () => {
    const sectionDoor = (selector: string): HTMLAnchorElement | null =>
      host().querySelector<HTMLAnchorElement>(`${selector} .talent__actions a`);

    const value = sectionDoor('section[aria-labelledby="talent-value-title"]');
    const steps = sectionDoor('#como-funciona');

    expect(value?.textContent?.trim()).toBe('Quiero que me busquen');
    expect(steps?.textContent?.trim()).toBe('Dejar mi correo');
  });

  it('opens no door through the side query parameter, because this form has no sides (US-015)', () => {
    // The copy-paste guard. On `/` a section door carries `?side=`; here the form
    // is `lockedKind="candidate"` and renders no fieldset, so a `side=` parameter
    // would be one nothing reads and would imply this form has two sides.
    expect(host().querySelectorAll('a[href*="side="]').length).toBe(0);
  });

  it('says nothing in English anywhere a visitor can read it', () => {
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
