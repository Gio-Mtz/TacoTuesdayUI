import { ILeadRequest, LeadKind } from '../../../api/Leads/ILead';
import { PageLang } from '../../../core/i18n/page-lang';
import { WAITLIST_COPY } from './waitlist-copy';

// Derived from the request the form sends, not written out: a field added to
// `ILeadRequest` leaves `ASKED_OF` and `REQUIRED` non-exhaustive and the build
// stops. `kind` is excluded because it is the side of the marketplace, not
// something the visitor types.
export type CollectedField = Exclude<keyof ILeadRequest, 'kind'>;

// `null` means every visitor is asked for it; a `LeadKind` means only that side
// sees the field at all.
const ASKED_OF: Readonly<Record<CollectedField, LeadKind | null>> = {
  name: null,
  email: null,
  company: 'company',
  role: 'candidate',
} as const;

const REQUIRED: Readonly<Record<CollectedField, boolean>> = {
  name: true,
  email: true,
  company: true,
  role: false,
} as const;

// The form's own label for the field, so the notice and the input can never call
// the same field two different things.
const LABEL: Readonly<Record<CollectedField, (lang: PageLang) => string>> = {
  name: (lang) => WAITLIST_COPY[lang].labelName,
  email: (lang) => WAITLIST_COPY[lang].labelEmail,
  company: (lang) => WAITLIST_COPY[lang].labelCompany,
  role: (lang) => WAITLIST_COPY[lang].labelRole,
} as const;

export interface CollectedFieldInfo {
  readonly field: CollectedField;

  readonly label: string;

  readonly required: boolean;

  readonly askedOf: LeadKind | null;
}

// What the waitlist stores, as the list the privacy notice names its fields from.
// `collected-fields.spec.ts` measures it against the labels the form actually
// renders; the honeypot is absent because it is never sent and never stored.
export function collectedFields(lang: PageLang): readonly CollectedFieldInfo[] {
  return (Object.keys(ASKED_OF) as CollectedField[]).map((field) => ({
    field,
    label: LABEL[field](lang),
    required: REQUIRED[field],
    askedOf: ASKED_OF[field],
  }));
}
