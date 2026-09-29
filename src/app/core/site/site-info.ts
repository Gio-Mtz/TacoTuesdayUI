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
   * The domain is ours: Gio registered `tacotuesdayco.com` on 29-sep-2026, which is
   * what closes board card OPS-6. The previous value, `hola@tacotuesday.mx`, was a
   * placeholder Claude invented on a domain **nobody here owns** — so the privacy
   * notice was pointing people who want their data deleted at a stranger's mail
   * server. That is the bug this line fixes, and it is why it was worth fixing
   * before anything else.
   *
   * STILL PENDING (board card OPS-7): the mailbox itself. Until Gio sets up
   * Cloudflare Email Routing for the domain, mail sent here bounces — it just
   * bounces at an address we control instead of somebody else's. Do not send the
   * landing page to anybody until OPS-7 is done.
   */
  contactEmail: 'hola@tacotuesdayco.com',

  /** Last substantive change to the privacy notice. Shown to the visitor. */
  privacyUpdatedAt: '29 de septiembre de 2026',
} as const;
