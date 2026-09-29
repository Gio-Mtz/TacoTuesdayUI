import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { ILeadRequest, ILeadResponse } from '../../../api/Leads/ILead';
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

    expect(text()).toContain('Escribe tu nombre.');
    expect(text()).toContain('Escribe tu correo.');
    expect(text()).toContain('Escribe el nombre de tu empresa.');
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

    expect(text()).toContain('Ese correo no se ve bien');
    http.expectNone(LEADS_URL);
  });

  it('clears the error as soon as the field is fixed', async () => {
    // The whole point of the `formValue` signal: zoneless + OnPush means
    // nothing repaints these messages unless something signals.
    await submit();
    expect(text()).toContain('Escribe tu nombre.');

    await type('waitlist-name', 'Gio');
    expect(text()).not.toContain('Escribe tu nombre.');
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
    expect(text()).toContain('(opcional)');
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
    expect(text()).toContain('Listo, quedaste anotado');
  });

  // ---- sending --------------------------------------------------------------

  it('disables the button and announces while the request is in flight', async () => {
    await fillValidCompany();
    await submit();

    const request = http.expectOne(LEADS_URL);
    expect(el<HTMLButtonElement>('.form__submit')?.disabled).toBe(true);
    expect(el('[role="status"]')?.textContent).toContain('Enviando');

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
    expect(text()).toContain('Listo, quedaste anotado');
    expect(text()).toContain('gio@empresa.mx');
    expect(document.activeElement).toBe(el('.confirm__title'));
  });

  it('says so instead of congratulating twice when the email was already there', async () => {
    await fillValidCompany();
    await submit();
    http.expectOne(LEADS_URL).flush({ id: 'lead-1', alreadyRegistered: true });
    await fixture.whenStable();

    expect(text()).toContain('Ya estabas en la lista');
    expect(text()).not.toContain('Listo, quedaste anotado');
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
    expect(text()).toContain('Algo falló de nuestro lado');
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

    expect(text()).toContain('Listo, quedaste anotado');
    expect(el('[role="alert"]')).toBeNull();
  });
});

describe('describeFailure', () => {
  const asHttp = (status: number): HttpErrorResponse =>
    new HttpErrorResponse({ status, statusText: 'x', url: '/api/leads' });

  it('blames the connection when the browser will not say why', () => {
    expect(describeFailure(asHttp(0))).toContain('No pudimos conectar');
  });

  it('points at the data on a 400 and a 422', () => {
    expect(describeFailure(asHttp(400))).toContain('validación del servidor');
    expect(describeFailure(asHttp(422))).toContain('validación del servidor');
  });

  it('asks for patience on a 429', () => {
    expect(describeFailure(asHttp(429))).toContain('Espera un minuto');
  });

  it('takes the blame on a 500', () => {
    expect(describeFailure(asHttp(500))).toContain('de nuestro lado');
  });

  it('takes the blame for anything that is not an HTTP error at all', () => {
    expect(describeFailure(new TypeError('undefined is not a function'))).toContain(
      'de nuestro lado',
    );
  });
});
