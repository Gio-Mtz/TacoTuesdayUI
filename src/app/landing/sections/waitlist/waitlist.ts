import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ILeadRequest, LeadKind } from '../../../api/Leads/ILead';
import { LeadsService } from '../../../api/Leads/leads.service';
import { Icon } from '../../../shared/icon/icon';

/** Where the section is in its one and only cycle. */
export type WaitlistStatus = 'idle' | 'sending' | 'success' | 'error';

/** The controls that can show an error message, in tab order. */
type FieldName = 'name' | 'email' | 'company' | 'role';

/** Longest value we will accept in a single-line field. */
const MAX_SHORT = 80;

/** Longest address we will accept. 254 is the RFC ceiling; 160 is generous. */
const MAX_EMAIL = 160;

/**
 * The waitlist form — the only place on this page where a visitor can act.
 *
 * Four decisions in here are load-bearing, and all four are argued in
 * `docs/adr/0003-waitlist-form.md`:
 *
 *  1. **Three fields, never more.** "How it works" promises out loud that this
 *     takes under a minute and that we do not ask for anything else yet. A
 *     fourth field would make the section above the form a lie.
 *  2. **The submit button is never disabled.** A greyed-out button that will not
 *     say why is the single most common accessibility failure in a sign-up
 *     form: a screen reader announces "dimmed" and the visitor is stuck with no
 *     way to find out what is wrong. It submits, and submitting is what reveals
 *     the errors.
 *  3. **Errors appear on submit, then live.** Validating while somebody is
 *     halfway through typing their address means telling them their email is
 *     wrong three times before it could possibly be right.
 *  4. **The form is replaced by the confirmation, and focus moves to it.** A
 *     success message appended below a still-filled form leaves a keyboard or
 *     screen-reader visitor with no idea anything happened.
 */
@Component({
  selector: 'ttco-waitlist',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, Icon],
  templateUrl: './waitlist.html',
  styleUrl: './waitlist.scss',
})
export class Waitlist {
  private readonly fb = inject(FormBuilder);
  private readonly leads = inject(LeadsService);
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);

  protected readonly form = this.fb.nonNullable.group({
    kind: this.fb.nonNullable.control<LeadKind>('company'),
    name: ['', [Validators.required, Validators.maxLength(MAX_SHORT)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(MAX_EMAIL)]],
    company: ['', [Validators.required, Validators.maxLength(MAX_SHORT)]],
    role: ['', [Validators.maxLength(MAX_SHORT)]],
    /**
     * Honeypot. Never shown, never focusable, never read aloud — see the
     * template. A form-filling bot fills every input it finds; a human cannot
     * reach this one, so any value at all means the submission is not a person.
     *
     * This stops the naive bots that render the page. It does NOT stop anything
     * posting straight at `/api/leads`, which is why US-004 carries its own
     * rate limit on the server. A client-side trap is a filter, not a fence.
     */
    website: [''],
  });

  protected readonly status = signal<WaitlistStatus>('idle');

  /** True once the visitor has pressed the button at least once. */
  protected readonly submitted = signal(false);

  /** Set when the API answered and the answer was bad. */
  protected readonly requestError = signal<string | null>(null);

  /** Set from the response: the email was already on the list. */
  protected readonly alreadyRegistered = signal(false);

  /**
   * Every value change, as a signal.
   *
   * Reactive-form state (`invalid`, `errors`, `touched`) is plain mutable
   * object state, not signals, and this app runs zoneless. Under `OnPush` with
   * no zone, nothing would mark the view dirty as the visitor fixes a field, so
   * the error text would freeze at whatever it said on submit. Reading this
   * inside `errors` is the subscription that makes the messages live.
   */
  private readonly formValue = toSignal(this.form.valueChanges, { initialValue: null });

  /** Which variant is on screen. Drives the labels and the extra field. */
  protected readonly kind = toSignal(this.form.controls.kind.valueChanges, {
    initialValue: this.form.controls.kind.value,
  });

  protected readonly isCompany = computed(() => this.kind() === 'company');

  private readonly successHeading = viewChild<ElementRef<HTMLElement>>('successHeading');

  /**
   * The live region's text. Empty while idle, because an `aria-live` region
   * that announces on first paint talks over the page load.
   *
   * It carries "sending" and nothing else: the confirmation is announced by
   * moving focus into the panel (richer — the visitor hears the whole message
   * and can read on), and the failure is announced by `role="alert"`.
   */
  protected readonly liveMessage = computed(() =>
    this.status() === 'sending' ? 'Sending your details…' : '',
  );

  /**
   * One message per field, or nothing before the first submit.
   *
   * Written as a map rather than a method per field so the template never calls
   * four functions per change detection pass, and so the order of the keys is
   * the order the messages were written in one place.
   */
  protected readonly errors = computed<Partial<Record<FieldName, string>>>(() => {
    // Dependency, not dead code: see `formValue` above. Without this read the
    // computed never recomputes and the messages go stale.
    this.formValue();

    if (!this.submitted()) {
      return {};
    }

    const messages: Partial<Record<FieldName, string>> = {};
    const { name, email, company, role } = this.form.controls;

    if (name.hasError('required')) {
      messages.name = 'Write your name.';
    } else if (name.hasError('maxlength')) {
      messages.name = `${MAX_SHORT} characters maximum.`;
    }

    if (email.hasError('required')) {
      messages.email = 'Write your email.';
    } else if (email.hasError('email')) {
      messages.email = 'That email does not look right. Check it has an @ and a domain.';
    } else if (email.hasError('maxlength')) {
      messages.email = `${MAX_EMAIL} characters maximum.`;
    }

    if (this.isCompany()) {
      if (company.hasError('required')) {
        messages.company = 'Write your company name.';
      } else if (company.hasError('maxlength')) {
        messages.company = `${MAX_SHORT} characters maximum.`;
      }
    } else if (role.hasError('maxlength')) {
      messages.role = `${MAX_SHORT} characters maximum.`;
    }

    return messages;
  });

  constructor() {
    // Switching sides swaps which extra field exists, so the validators and the
    // value of the one that just disappeared have to go with it. Without the
    // reset, typing "Acme" as a company and then switching to engineer posts
    // "Acme" as the candidate's role.
    this.form.controls.kind.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((kind) => this.applyKind(kind));

    // The confirmation panel only exists after a successful send, so this runs
    // exactly once, the moment the heading enters the DOM. Focus is what tells
    // a keyboard or screen-reader visitor that the form is gone and why.
    effect(() => {
      this.successHeading()?.nativeElement.focus();
    });
  }

  protected submit(): void {
    // Guard one of two against a double send. The button is also disabled while
    // sending, but a disabled attribute is a suggestion: Enter in a text field
    // still fires submit in several browsers, and a fast double click can land
    // both events before the first render.
    if (this.status() === 'sending') {
      return;
    }

    this.submitted.set(true);
    this.requestError.set(null);

    const raw = this.form.getRawValue();

    // Honeypot tripped. Answer exactly as if it had worked: a bot that is told
    // it was caught is a bot that gets rewritten. Nothing is sent.
    if (raw.website.trim() !== '') {
      this.alreadyRegistered.set(false);
      this.status.set('success');
      return;
    }

    if (this.form.invalid) {
      this.status.set('idle');
      this.focusFirstInvalid();
      return;
    }

    this.status.set('sending');

    const payload: ILeadRequest = {
      kind: raw.kind,
      name: raw.name.trim(),
      email: raw.email.trim(),
      company: raw.kind === 'company' ? raw.company.trim() : null,
      role: raw.kind === 'candidate' ? raw.role.trim() || null : null,
    };

    this.leads.create(payload).subscribe({
      next: (response) => {
        this.alreadyRegistered.set(response.alreadyRegistered);
        this.status.set('success');
      },
      error: (error: unknown) => {
        this.requestError.set(describeFailure(error));
        this.status.set('error');
      },
    });
  }

  /** Back to an empty form, for the "sign someone else up" button. */
  protected reset(): void {
    this.form.reset({ kind: this.form.controls.kind.value });
    this.applyKind(this.form.controls.kind.value);
    this.submitted.set(false);
    this.requestError.set(null);
    this.alreadyRegistered.set(false);
    this.status.set('idle');
  }

  private applyKind(kind: LeadKind): void {
    const { company, role } = this.form.controls;

    if (kind === 'company') {
      role.reset('');
      company.setValidators([Validators.required, Validators.maxLength(MAX_SHORT)]);
    } else {
      company.reset('');
      company.clearValidators();
    }

    company.updateValueAndValidity();
  }

  /**
   * Sends focus to the first field that failed, in the order they are read.
   *
   * Without this, pressing the button with an empty form leaves focus on the
   * button: a sighted visitor sees red text appear, and a blind one hears
   * nothing at all and has to walk the whole form to find out what happened.
   */
  private focusFirstInvalid(): void {
    const order: readonly FieldName[] = ['name', 'email', 'company', 'role'];
    const first = order.find((field) => this.form.controls[field].invalid);

    if (!first) {
      return;
    }

    this.host.nativeElement
      .querySelector<HTMLElement>(`#waitlist-${first}`)
      ?.focus();
  }
}

/**
 * Turns whatever the HTTP layer threw into one sentence a person can act on.
 *
 * Exported for the spec: the mapping is the interesting part, and testing it
 * through four rendered components is slower and says less.
 */
export function describeFailure(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Something broke on our side. Try again in a moment.';
  }

  switch (error.status) {
    case 0:
      // Status 0 is the browser refusing to tell us why: offline, DNS, or a
      // CORS preflight that never came back. From here they look identical.
      return 'We could not reach the server. Check your connection and try again.';
    case 400:
    case 422:
      return 'Some field did not pass the server validation. Check it and try again.';
    case 429:
      return 'Too many attempts in a row. Wait a minute and try again.';
    default:
      return 'Something broke on our side. Try again in a moment.';
  }
}
