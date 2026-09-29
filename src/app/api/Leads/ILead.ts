/**
 * The waitlist contract, as the UI needs it.
 *
 * This file is the front end's half of an agreement that US-004 implements on
 * the API side. It is written here first, and deliberately: the shape of the
 * request is a product decision (what we are willing to ask a stranger for
 * before they trust us), not an implementation detail of the C# module.
 *
 * Keep it small. Every field added here is a field the visitor has to fill in
 * before we have earned anything, and "Cómo funciona" promises out loud that
 * leaving your email takes under a minute.
 */

/** Which side of the marketplace the lead is on. Drives everything else. */
export type LeadKind = 'company' | 'candidate';

/** Body of `POST /api/leads`. */
export interface ILeadRequest {
  readonly kind: LeadKind;

  /** How the person wants to be addressed. Trimmed, never empty. */
  readonly name: string;

  /**
   * Trimmed, case preserved. The API is the one that normalises case for the
   * uniqueness check — two people who typed `Ana@` and `ana@` are one lead, but
   * the confirmation mail should go out spelled the way they wrote it.
   */
  readonly email: string;

  /** Company name. Required when `kind` is `company`, `null` otherwise. */
  readonly company: string | null;

  /** Role or area the candidate is after. Always optional, `null` when empty. */
  readonly role: string | null;
}

/** Body of a successful `POST /api/leads`, 200 or 201. */
export interface ILeadResponse {
  /** Server-assigned id. The UI does not use it; it exists so support can. */
  readonly id: string;

  /**
   * True when this email was already on the list.
   *
   * This is what makes US-004's idempotency visible instead of merely correct:
   * posting the same address twice is a success, not a 409, and the visitor is
   * told "ya estabas en la lista" rather than being congratulated twice or
   * shown an error for doing nothing wrong.
   */
  readonly alreadyRegistered: boolean;
}
