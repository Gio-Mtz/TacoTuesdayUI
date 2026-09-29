/**
 * The handful of facts about the business that appear in more than one place.
 *
 * They live in one constant so that changing the contact address is one edit
 * and not a grep across templates — and so the privacy notice, the footer and
 * (in US-003) the form's confirmation copy can never disagree about it.
 */
export const SITE_INFO = {
  /** Short name, used as the wordmark. */
  name: 'Taco Tuesday',

  /** Full name, used where a legal entity is expected. */
  legalName: 'Taco Tuesday Consulting',

  /**
   * Public mailbox. Shown in the footer and named in the privacy notice as the
   * channel to ask for deletion of a lead, so it has to be a real address that
   * someone reads.
   *
   * PENDING (board card OPS-6): Gio has not confirmed the public mailbox yet.
   * The value below is a placeholder and MUST be confirmed before this lands in
   * production, or the footer offers a contact that bounces and the privacy
   * notice promises a deletion channel that does not exist.
   */
  contactEmail: 'hola@tacotuesday.mx',

  /** Last substantive change to the privacy notice. Shown to the visitor. */
  privacyUpdatedAt: '29 de septiembre de 2026',
} as const;
