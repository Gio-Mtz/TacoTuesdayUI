import { LeadKind } from '../../../api/Leads/ILead';

/**
 * GA4's own recommended event for "someone left their contact details". Using the
 * recommended name rather than an invented one is what lets this show up in GA4's
 * stock reports and be marked as a key event without any extra configuration.
 */
export const WAITLIST_LEAD_EVENT = 'generate_lead';

export interface WaitlistLeadParams extends Record<string, string | boolean> {
  /** Which side of the marketplace signed up. This is the question the sprint exists to answer. */
  readonly lead_kind: LeadKind;

  /**
   * True when the API recognised the address and returned the existing lead. These are
   * not new leads, and counting them as such would quietly inflate the only number
   * anyone is going to look at.
   */
  readonly already_registered: boolean;
}

export function waitlistLeadParams(kind: LeadKind, alreadyRegistered: boolean): WaitlistLeadParams {
  return { lead_kind: kind, already_registered: alreadyRegistered };
}
