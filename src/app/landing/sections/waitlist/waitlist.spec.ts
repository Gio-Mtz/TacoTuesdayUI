import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { ILeadRequest, ILeadResponse } from '../../../api/Leads/ILead';
import { PageLangService } from '../../../core/i18n/page-lang';
import { WAITLIST_COPY } from './waitlist-copy';
import { Waitlist, describeFailure } from './waitlist';

/**
 * These tests drive the component through the DOM — typing in inputs, clicking
 * radios, submitting the form — rather than by poking at the `FormGroup`.
 *
 * That is deliberate and it is not purism: the two things most likely to break
 * this section are the template bindings and the zoneless change detection, and
 * a test that calls `form.setValue()` exercises neither. Every assertion below
 * would still hold if the class were rewritten, and would fail if the label
 * stopped being tied to its input.
 */
describe('Waitlist', () => {
  let fixture: ComponentFixture<Waitlist>;
  let http: HttpTestingController;

  /** The endpoint US-004 will implement. */
  const LEADS_URL = '/api/leads';

  const OK: ILeadResponse = { id: 'lead-1', alreadyRegistered: false };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Waitlist],
      providers: [
        provideHttpClient(),
        // Swaps the real backend for one this test drives. Without it the
        // component fires an actual request and dies with "0 Unknown Error".
        provideHttpClientTesting(),
        // The legal line under the button carries a routerLink.
        provideRouter([]),
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Waitlist);
    await fixture.whenStable();
  });

  afterEach(() => {
    // Fails the test if the component fired a request nobody asserted on —
    // which is exactly how a regression in the honeypot would show up.
    http.verify();
  });

  // ---- helpers --------------------------------------------------------------

  const el = <T extends HTMLElement>(selector: string): T | null =>
    (fixture.nativeElement as HTMLElement).querySelector<T>(selector);

  const text = (): string => (fixture.nativeElement as HTMLElement).textContent ?? '';

  async function type(id: string, value: string): Promise<void> {
    const input = el<HTMLInputElement>(`#${id}`);
    if (!input) {
      throw new Error(`No input with id ${id} — the template changed.`);
    }
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  async function pick(variant: 'company' | 'candidate'): Promise<void> {
    const radio = el<HTMLInputElement>(`input[type="radio"][value="${variant}"]`);
    if (!radio) {
      throw new Error(`No radio for ${variant} — the template changed.`);
    }
    radio.click();
    await fixture.whenStable();
  }

  async function submit(): Promise<void> {
    el<HTMLFormElement>('form')?.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
    await fixture.whenStable();
  }

  /** Fills the company variant with values that pass every validator. */
  async function fillValidCompany(): Promise<void> {
    await type('waitlist-name', 'Gio Martínez');
    await type('waitlist-email', 'gio@empresa.mx');
    await type('waitlist-company', 'Taco Tuesday');
  }

  // ---- render ---------------------------------------------------------------

  it('renders the form with no errors before anything is submitted', () => {
    expect(el('form')).toBeTruthy();
    expect(el('#waitlist-name')).toBeTruthy();
    expect(el('#waitlist-email')).toBeTruthy();
    expect(el('.field__error')).toBeNull();
  });

  it('starts on the company variant and shows the company field', () => {
    expect(el<HTMLInputElement>('input[value="company"]')?.checked).toBe(true);
    expect(el('#waitlist-company')).toBeTruthy();
    expect(el('#waitlist-role')).toBeNull();
  });

  it('gives every visible input a label that points at it', () => {
    const inputs = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>(
        '.field__input',
      ),
    );
    expect(inputs.length).toBeGreaterThan(0);
    for (const input of inputs) {
      expect(el(`label[for="${input.id}"]`)).toBeTruthy();
    }
  });

  it('never disables the submit button for an invalid form', () => {
    // A greyed-out button that will not say why is the failure mode this form
    // was designed around. If this test starts failing, read ADR 0003 first.
    expect(el<HTMLButtonElement>('.form__submit')?.disabled).toBe(false);
  });

  // ---- validation -----------------------------------------------------------

  it('shows required errors on submit and sends nothing', async () => {
    await submit();

    expect(text()).toContain('Write your name.');
    expect(text()).toContain('Write your email.');
    expect(text()).toContain('Write your company name.');
    http.expectNone(LEADS_URL);
  });

  it('moves focus to the first field that failed', async () => {
    await submit();
    expect(document.activeElement?.id).toBe('waitlist-name');
  });

  it('marks a failed field with aria-invalid and wires it to its message', async () => {
    await submit();

    const email = el<HTMLInputElement>('#waitlist-email');
    expect(email?.getAttribute('aria-invalid')).toBe('true');
    expect(email?.getAttribute('aria-describedby')).toBe('waitlist-email-error');
    expect(el('#waitlist-email-error')).toBeTruthy();
  });

  it('rejects an address with no domain', async () => {
    await type('waitlist-name', 'Gio');
    await type('waitlist-email', 'gio@');
    await type('waitlist-company', 'Taco Tuesday');
    await submit();

    expect(text()).toContain('That email does not look right');
    http.expectNone(LEADS_URL);
  });

  it('clears the error as soon as the field is fixed', async () => {
    // The whole point of the `formValue` signal: zoneless + OnPush means
    // nothing repaints these messages unless something signals.
    await submit();
    expect(text()).toContain('Write your name.');

    await type('waitlist-name', 'Gio');
    expect(text()).not.toContain('Write your name.');
  });

  // ---- variants -------------------------------------------------------------

  it('keeps both radios in one named group', async () => {
    // Regression guard. Angular's radio value accessor left `name` EMPTY here,
    // and an empty name means the browser never forms a radio group: each input
    // became its own tab stop and arrow-key selection updated the DOM without
    // reaching the form control, so the field below never swapped. Caught by
    // rendering the page in Chromium, not by any assertion that existed before
    // this one. If `name` ever disappears from the template again, this fails.
    const radios = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>(
        'input[type="radio"]',
      ),
    );

    expect(radios.length).toBe(2);
    for (const radio of radios) {
      expect(radio.getAttribute('name')).toBeTruthy();
    }
    expect(radios[0].getAttribute('name')).toBe(radios[1].getAttribute('name'));
  });

  it('swaps the company field for an optional role when switching sides', async () => {
    await pick('candidate');

    expect(el('#waitlist-company')).toBeNull();
    expect(el('#waitlist-role')).toBeTruthy();
    expect(text()).toContain('(optional)');
  });

  it('does not require anything extra from a candidate', async () => {
    await pick('candidate');
    await type('waitlist-name', 'Gio');
    await type('waitlist-email', 'gio@correo.mx');
    await submit();

    const request = http.expectOne(LEADS_URL);
    request.flush(OK);
  });

  it('does not carry the company name over into the role', async () => {
    await type('waitlist-company', 'Taco Tuesday');
    await pick('candidate');
    await type('waitlist-name', 'Gio');
    await type('waitlist-email', 'gio@correo.mx');
    await submit();

    const body = http.expectOne(LEADS_URL).request.body as ILeadRequest;
    expect(body.role).toBeNull();
    expect(body.company).toBeNull();
    http.expectNone(LEADS_URL);
  });

  // ---- payload --------------------------------------------------------------

  it('posts the company payload to /api/leads', async () => {
    await fillValidCompany();
    await submit();

    const request = http.expectOne(LEADS_URL);
    expect(request.request.method).toBe('POST');

    const body = request.request.body as ILeadRequest;
    expect(body).toEqual({
      kind: 'company',
      name: 'Gio Martínez',
      email: 'gio@empresa.mx',
      company: 'Taco Tuesday',
      role: null,
    });

    request.flush(OK);
  });

  it('posts the candidate payload with the role filled in', async () => {
    await pick('candidate');
    await type('waitlist-name', 'Gio');
    await type('waitlist-email', 'gio@correo.mx');
    await type('waitlist-role', 'Backend .NET');
    await submit();

    const request = http.expectOne(LEADS_URL);
    const body = request.request.body as ILeadRequest;
    expect(body).toEqual({
      kind: 'candidate',
      name: 'Gio',
      email: 'gio@correo.mx',
      company: null,
      role: 'Backend .NET',
    });

    request.flush(OK);
  });

  it('trims what the visitor typed and never sends the honeypot', async () => {
    await type('waitlist-name', '  Gio  ');
    await type('waitlist-email', '  gio@empresa.mx ');
    await type('waitlist-company', ' Taco Tuesday ');
    await submit();

    const request = http.expectOne(LEADS_URL);
    const body = request.request.body as Record<string, unknown>;
    expect(body['name']).toBe('Gio');
    expect(body['email']).toBe('gio@empresa.mx');
    expect(body['company']).toBe('Taco Tuesday');
    expect(body['website']).toBeUndefined();

    request.flush(OK);
  });

  // ---- honeypot -------------------------------------------------------------

  it('keeps the honeypot out of sight and out of the tab order', () => {
    const trap = el<HTMLInputElement>('#waitlist-website');
    expect(trap).toBeTruthy();
    expect(trap?.tabIndex).toBe(-1);
    expect(trap?.closest('[aria-hidden="true"]')).toBeTruthy();
  });

  it('sends nothing when the honeypot is filled, and says nothing about it', async () => {
    await fillValidCompany();
    await type('waitlist-website', 'https://spam.example');
    await submit();

    // No request at all — `http.verify()` in afterEach is the real assertion.
    http.expectNone(LEADS_URL);
    // And the bot is told it worked, so it has no signal to adapt to.
    expect(text()).toContain('Done, you are on the list');
  });

  // ---- sending --------------------------------------------------------------

  it('disables the button and announces while the request is in flight', async () => {
    await fillValidCompany();
    await submit();

    const request = http.expectOne(LEADS_URL);
    expect(el<HTMLButtonElement>('.form__submit')?.disabled).toBe(true);
    expect(el('[role="status"]')?.textContent).toContain('Sending');

    request.flush(OK);
  });

  it('blocks a second submit while the first is still in flight', async () => {
    await fillValidCompany();
    await submit();
    await submit();
    await submit();

    // expectOne throws if there is more than one match, which is the assertion.
    http.expectOne(LEADS_URL).flush(OK);
  });

  // ---- success --------------------------------------------------------------

  it('replaces the form with a confirmation and focuses it', async () => {
    await fillValidCompany();
    await submit();
    http.expectOne(LEADS_URL).flush(OK);
    await fixture.whenStable();

    expect(el('form')).toBeNull();
    expect(text()).toContain('Done, you are on the list');
    expect(text()).toContain('gio@empresa.mx');
    expect(document.activeElement).toBe(el('.confirm__title'));
  });

  it('says so instead of congratulating twice when the email was already there', async () => {
    await fillValidCompany();
    await submit();
    http.expectOne(LEADS_URL).flush({ id: 'lead-1', alreadyRegistered: true });
    await fixture.whenStable();

    expect(text()).toContain('You were already on the list');
    expect(text()).not.toContain('Done, you are on the list');
  });

  it('goes back to an empty form for the next person', async () => {
    await fillValidCompany();
    await submit();
    http.expectOne(LEADS_URL).flush(OK);
    await fixture.whenStable();

    el<HTMLButtonElement>('.confirm__again')?.click();
    await fixture.whenStable();

    expect(el('form')).toBeTruthy();
    expect(el<HTMLInputElement>('#waitlist-name')?.value).toBe('');
    // A fresh form has not been submitted, so it shows no errors yet.
    expect(el('.field__error')).toBeNull();
  });

  // ---- failure --------------------------------------------------------------

  it('keeps the form and raises an alert when the API fails', async () => {
    await fillValidCompany();
    await submit();

    http
      .expectOne(LEADS_URL)
      .flush({ detail: 'boom' }, { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();

    expect(el('form')).toBeTruthy();
    expect(el('[role="alert"]')).toBeTruthy();
    expect(text()).toContain('Something broke on our side');
    // What they typed is still there — retrying must not mean retyping.
    expect(el<HTMLInputElement>('#waitlist-name')?.value).toBe('Gio Martínez');
  });

  it('lets the visitor retry after a failure', async () => {
    await fillValidCompany();
    await submit();
    http.expectOne(LEADS_URL).error(new ProgressEvent('error'), { status: 0 });
    await fixture.whenStable();

    await submit();
    http.expectOne(LEADS_URL).flush(OK);
    await fixture.whenStable();

    expect(text()).toContain('Done, you are on the list');
    expect(el('[role="alert"]')).toBeNull();
  });
});

describe('describeFailure', () => {
  const asHttp = (status: number): HttpErrorResponse =>
    new HttpErrorResponse({ status, statusText: 'x', url: '/api/leads' });

  /**
   * The wording is an argument since US-010, so these assert the MAPPING — which
   * of the four outcomes a status code is — and read the sentence out of the copy
   * record instead of repeating it. A literal here would pass just as happily if
   * the function started returning the rate-limit sentence for a 500.
   */
  const en = WAITLIST_COPY.en.failures;
  const es = WAITLIST_COPY['es-MX'].failures;

  it('blames the connection when the browser will not say why', () => {
    expect(describeFailure(asHttp(0), en)).toBe(en.offline);
  });

  it('points at the data on a 400 and a 422', () => {
    expect(describeFailure(asHttp(400), en)).toBe(en.validation);
    expect(describeFailure(asHttp(422), en)).toBe(en.validation);
  });

  it('asks for patience on a 429', () => {
    expect(describeFailure(asHttp(429), en)).toBe(en.rateLimited);
  });

  it('takes the blame on a 500', () => {
    expect(describeFailure(asHttp(500), en)).toBe(en.generic);
  });

  it('takes the blame for anything that is not an HTTP error at all', () => {
    expect(describeFailure(new TypeError('undefined is not a function'), en)).toBe(en.generic);
  });

  it('answers in whichever language it was handed', () => {
    // The point of the parameter. Before US-010 a Spanish page would have shown
    // an English failure message and nothing would have failed.
    expect(describeFailure(asHttp(429), es)).toBe(es.rateLimited);
    expect(describeFailure(asHttp(0), es)).toBe(es.offline);
  });
});

/**
 * The two things US-010 added to this component: it speaks the language of the
 * page it is on, and a page can pin which side of the marketplace it is for.
 *
 * Driven through the DOM like the rest of the file, and for the same reason — the
 * failure modes are a binding that was missed and a validator that did not swap,
 * neither of which a test of the class would see.
 */
describe('Waitlist on a Spanish page, pinned to the engineer', () => {
  let fixture: ComponentFixture<Waitlist>;
  let http: HttpTestingController;

  const es = WAITLIST_COPY['es-MX'];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Waitlist],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);

    // What the router does on `/talento`: `PageHeadStrategy` reads `data.lang`
    // and writes it here. Setting it before the first render is the realistic
    // order — the strategy runs before the component is shown.
    TestBed.inject(PageLangService).set('es-MX');

    fixture = TestBed.createComponent(Waitlist);
    fixture.componentRef.setInput('lockedKind', 'candidate');
    fixture.componentRef.setInput('sectionId', 'lista-de-espera');
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const text = (): string => host().textContent ?? '';

  it('renders its own words, not the English ones', () => {
    expect(text()).toContain(es.title);
    expect(text()).toContain(es.labelEmail);
    expect(text()).toContain(es.submit);
    expect(text()).not.toContain(WAITLIST_COPY.en.title);
    expect(text()).not.toContain(WAITLIST_COPY.en.submit);
  });

  it('takes the id the page gave it, so the anchor is in Spanish too', () => {
    // `/talento#lista-de-espera`, not `/talento#waitlist`. The fragment is in the
    // address bar and in whatever gets pasted into WhatsApp.
    expect(host().querySelector('section')?.id).toBe('lista-de-espera');
  });

  it('drops the chooser entirely rather than hiding it', () => {
    // Removed from the DOM, not `hidden`: a hidden fieldset is still a radiogroup
    // that assistive tech can be told about, and this page has no question.
    expect(host().querySelector('fieldset')).toBeNull();
    expect(host().querySelectorAll('input[type="radio"]').length).toBe(0);
  });

  it('shows the engineer their field and not the company one', () => {
    expect(host().querySelector('#waitlist-role')).toBeTruthy();
    expect(host().querySelector('#waitlist-company')).toBeNull();
    expect(text()).toContain(es.roleOptional);
  });

  it('posts kind=candidate with no company, and submits with role left empty', async () => {
    // The regression this guards: pinning the kind by setting the control is only
    // correct if the change EMITS, because the emit is what clears `company`'s
    // required validator. Without it the form is invalid forever and the button
    // does nothing — on a page with no way to see or fix the offending field.
    const fill = async (id: string, value: string): Promise<void> => {
      const input = host().querySelector<HTMLInputElement>(`#${id}`)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
      await fixture.whenStable();
    };

    await fill('waitlist-name', 'Gio');
    await fill('waitlist-email', 'gio@dev.mx');

    host().querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    const request = http.expectOne('/api/leads');
    const body = request.request.body as Record<string, unknown>;

    expect(body['kind']).toBe('candidate');
    expect(body['company']).toBeNull();
    expect(body['role']).toBeNull();

    request.flush({ id: 'lead-9', alreadyRegistered: false });
    await fixture.whenStable();

    expect(text()).toContain(es.successTitle);
  });

  it('reports a failure in Spanish', async () => {
    const fill = async (id: string, value: string): Promise<void> => {
      const input = host().querySelector<HTMLInputElement>(`#${id}`)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
      await fixture.whenStable();
    };

    await fill('waitlist-name', 'Gio');
    await fill('waitlist-email', 'gio@dev.mx');

    host().querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    http.expectOne('/api/leads').flush('too many', { status: 429, statusText: 'Too Many' });
    await fixture.whenStable();

    expect(host().querySelector('[role="alert"]')?.textContent).toContain(es.failures.rateLimited);
  });

  it('writes its validation messages in Spanish', async () => {
    host().querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(text()).toContain(es.errors.nameRequired);
    expect(text()).toContain(es.errors.emailRequired);
    // Pinned to the engineer, so the company field is not there to complain.
    expect(text()).not.toContain(es.errors.companyRequired);
  });
});
