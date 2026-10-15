import { LeadKind } from '../../../api/Leads/ILead';

export const WAITLIST_SIDE_PARAM = 'side';

// The accepted values are the `LeadKind`s themselves, so the value in the URL,
// the one posted to `/api/leads` and the one reported to GA4 are one string with
// no mapping to drift. Anything else is `null` -- "the visitor did not say" --
// and never an error.
export function waitlistSideFrom(value: string | null | undefined): LeadKind | null {
  return value === 'company' || value === 'candidate' ? value : null;
}

export function waitlistSideQuery(kind: LeadKind): Readonly<Record<string, string>> {
  return { [WAITLIST_SIDE_PARAM]: kind };
}
