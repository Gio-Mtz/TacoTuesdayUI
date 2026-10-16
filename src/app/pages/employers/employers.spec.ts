import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { routes } from '../../app.routes';
import { PageLangService } from '../../core/i18n/page-lang';
import { SHELL_COPY } from '../../core/i18n/shell-copy';
import { WAITLIST_COPY } from '../../landing/sections/waitlist/waitlist-copy';
import { Employers } from './employers';

describe('Employers', () => {
  let fixture: ComponentFixture<Employers>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Employers],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter(routes)],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);

    TestBed.inject(PageLangService).set('es-MX');

    fixture = TestBed.createComponent(Employers);
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const text = (): string => host().textContent ?? '';

  it('leads with the company-side promise, in Spanish, in the h1', () => {
    const line = host().querySelector('h1')!.textContent!.replace(/\s+/g, ' ').trim();

    expect(line).toBe('Deja de quemar semanas en entrevistas que no filtran nada');
  });

  it('has exactly one h1', () => {
    expect(host().querySelectorAll('h1').length).toBe(1);
  });

  it('provides every anchor the Spanish header nav points at this page', () => {
    const wanted = SHELL_COPY['es-MX'].nav
      .filter((link) => link.path === '/empresas')
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
    const steps = Array.from(host().querySelectorAll('#como-funciona .tt-card__title'));

    expect(steps.length).toBe(3);
    expect(steps.map((h) => h.textContent?.trim().slice(0, 2))).toEqual(['1.', '2.', '3.']);
  });

  it('orders the steps in a list that says the order is the meaning', () => {
    expect(host().querySelector('#como-funciona ol')).toBeTruthy();
  });

  it('embeds the shared form pinned to the company side, and in Spanish', () => {
    const form = host().querySelector('#lista-de-espera')!;

    // The whole point of the page: no chooser to get wrong, and the field a
    // hiring team has to fill is the one that is rendered.
    expect(form.querySelector('fieldset')).toBeNull();
    expect(form.querySelector('#waitlist-company')).toBeTruthy();
    expect(form.querySelector('#waitlist-role')).toBeNull();
    expect(text()).toContain(WAITLIST_COPY['es-MX'].submit);
  });

  it('sends its own call to action to its own form', () => {
    const cta = host().querySelector('.employers-hero__actions a')!;

    expect(cta.getAttribute('href')).toBe('/empresas#lista-de-espera');
  });

  it('gives every section that argues its own door, and none of them to the other page', () => {
    const doors = Array.from(
      host().querySelectorAll<HTMLAnchorElement>('a[href*="lista-de-espera"]'),
    ).map((a) => a.getAttribute('href'));

    expect(doors).toEqual([
      '/empresas#lista-de-espera',
      '/empresas#lista-de-espera',
      '/empresas#lista-de-espera',
    ]);
  });

  it('opens no door through the side query parameter, because this form has no sides', () => {
    expect(host().querySelectorAll('a[href*="side="]').length).toBe(0);
  });

  it('sends a dev who landed here to the page whose form asks what a dev can answer', () => {
    const out = host().querySelector<HTMLAnchorElement>('.employers-crossover a')!;

    expect(out.getAttribute('href')).toBe('/talento');
  });

  it('says nothing in English anywhere a visitor can read it', () => {
    const english = [
      WAITLIST_COPY.en.title,
      WAITLIST_COPY.en.submit,
      WAITLIST_COPY.en.labelEmail,
      'How it works',
      'For companies',
    ];

    expect(english.filter((phrase) => text().includes(phrase))).toEqual([]);
  });
});
