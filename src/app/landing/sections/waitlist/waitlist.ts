import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ILeadRequest, LeadKind } from '../../../api/Leads/ILead';
import { LeadsService } from '../../../api/Leads/leads.service';
import { privacyRoute } from '../../../core/i18n/language-switch';
import { PageLangService } from '../../../core/i18n/page-lang';
import { Icon } from '../../../shared/icon/icon';
import { WAITLIST_COPY, WaitlistFailureCopy } from './waitlist-copy';

export type WaitlistStatus = 'idle' | 'sending' | 'success' | 'error';

type FieldName = 'name' | 'email' | 'company' | 'role';

const MAX_SHORT = 80;

const MAX_EMAIL = 160;

@Component({
  selector: 'ttco-waitlist',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, Icon],
  templateUrl: './waitlist.html',
  styleUrl: './waitlist.scss',
})
export class Waitlist implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly leads = inject(LeadsService);
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly pageLang = inject(PageLangService);

  readonly lockedKind = input<LeadKind | null>(null);

  readonly sectionId = input<string>('waitlist');

  protected readonly copy = computed(() => WAITLIST_COPY[this.pageLang.lang()]);

  protected readonly privacyLink = computed(() => privacyRoute(this.pageLang.lang()));

  protected readonly privacyLang = this.pageLang.lang;

  protected readonly form = this.fb.nonNullable.group({
    kind: this.fb.nonNullable.control<LeadKind>('company'),
    name: ['', [Validators.required, Validators.maxLength(MAX_SHORT)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(MAX_EMAIL)]],
    company: ['', [Validators.required, Validators.maxLength(MAX_SHORT)]],
    role: ['', [Validators.maxLength(MAX_SHORT)]],

    website: [''],
  });

  protected readonly status = signal<WaitlistStatus>('idle');

  protected readonly submitted = signal(false);

  protected readonly requestError = signal<string | null>(null);

  protected readonly alreadyRegistered = signal(false);

  private readonly formValue = toSignal(this.form.valueChanges, { initialValue: null });

  protected readonly kind = toSignal(this.form.controls.kind.valueChanges, {
    initialValue: this.form.controls.kind.value,
  });

  protected readonly isCompany = computed(() => this.kind() === 'company');

  private readonly successHeading = viewChild<ElementRef<HTMLElement>>('successHeading');

  protected readonly liveMessage = computed(() =>
    this.status() === 'sending' ? this.copy().sending : '',
  );

  protected readonly errors = computed<Partial<Record<FieldName, string>>>(() => {
    this.formValue();

    if (!this.submitted()) {
      return {};
    }

    const messages: Partial<Record<FieldName, string>> = {};
    const { name, email, company, role } = this.form.controls;
    const words = this.copy().errors;

    if (name.hasError('required')) {
      messages.name = words.nameRequired;
    } else if (name.hasError('maxlength')) {
      messages.name = words.maxChars(MAX_SHORT);
    }

    if (email.hasError('required')) {
      messages.email = words.emailRequired;
    } else if (email.hasError('email')) {
      messages.email = words.emailInvalid;
    } else if (email.hasError('maxlength')) {
      messages.email = words.maxChars(MAX_EMAIL);
    }

    if (this.isCompany()) {
      if (company.hasError('required')) {
        messages.company = words.companyRequired;
      } else if (company.hasError('maxlength')) {
        messages.company = words.maxChars(MAX_SHORT);
      }
    } else if (role.hasError('maxlength')) {
      messages.role = words.maxChars(MAX_SHORT);
    }

    return messages;
  });

  constructor() {
    this.form.controls.kind.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((kind) => this.applyKind(kind));

    effect(() => {
      this.successHeading()?.nativeElement.focus();
    });
  }

  ngOnInit(): void {
    const locked = this.lockedKind();

    if (locked) {
      this.form.controls.kind.setValue(locked);
    }
  }

  protected submit(): void {
    if (this.status() === 'sending') {
      return;
    }

    this.submitted.set(true);
    this.requestError.set(null);

    const raw = this.form.getRawValue();

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
        this.requestError.set(describeFailure(error, this.copy().failures));
        this.status.set('error');
      },
    });
  }

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

  private focusFirstInvalid(): void {
    const order: readonly FieldName[] = ['name', 'email', 'company', 'role'];
    const first = order.find((field) => this.form.controls[field].invalid);

    if (!first) {
      return;
    }

    this.host.nativeElement.querySelector<HTMLElement>(`#waitlist-${first}`)?.focus();
  }
}

export function describeFailure(error: unknown, copy: WaitlistFailureCopy): string {
  if (!(error instanceof HttpErrorResponse)) {
    return copy.generic;
  }

  switch (error.status) {
    case 0:
      return copy.offline;
    case 400:
    case 422:
      return copy.validation;
    case 429:
      return copy.rateLimited;
    default:
      return copy.generic;
  }
}
