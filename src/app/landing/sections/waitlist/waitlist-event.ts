import { LeadKind } from '../../../api/Leads/ILead';

// GA4's recommended event name: an invented one would not appear in the stock
// reports or be markable as a key event.
export const WAITLIST_LEAD_EVENT = 'generate_lead';

export interface WaitlistLeadParams extends Record<string, string | boolean> {
  readonly lead_kind: LeadKind;

  // True when the API recognised the address and returned the existing lead.
  // Counting these as new would inflate the only number anyone looks at.
  readonly already_registered: boolean;
}

export function waitlistLeadParams(kind: LeadKind, alreadyRegistered: boolean): WaitlistLeadParams {
  return { lead_kind: kind, already_registered: alreadyRegistered };
}
