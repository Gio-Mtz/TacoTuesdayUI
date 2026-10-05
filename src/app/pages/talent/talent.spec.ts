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
      providers: [
        provideHttpClient(),

        provideHttpClientTesting(),
        provideRouter(routes),
      ],
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
