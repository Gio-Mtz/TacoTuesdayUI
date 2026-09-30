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
   * ✅ OPS-7 is done: Gio set up Cloudflare Email Routing on 29-sep-2026 and mail
   * to this address now lands in his personal inbox. It no longer bounces.
   *
   * ⚠️ The LOCAL PART changed with it, and that was not cosmetic. This line said
   * `hola@` while the routing rule Gio actually created is for **`hello@`** — so
   * for as long as both were true, the footer and the privacy notice were showing
   * a bouncing address on a live site, which is precisely the failure OPS-6 and
   * OPS-7 existed to end. It is `hello@` here because that is the mailbox that
   * verifiably exists, not because `hello` beat `hola` on merit: with a Spanish
   * landing, `hola@` reads better. Adding a second rule in Cloudflare is free and
   * takes a minute — do that and this line flips back in one edit.
   *
   * The lesson worth keeping: this value is only as true as a routing rule in
   * somebody else's dashboard. Changing the rule without changing this line, or
   * the reverse, breaks it silently — nothing in the build can catch it.
   */
  contactEmail: 'hello@tacotuesdayco.com',

  /** Last substantive change to the privacy notice. Shown to the visitor. */
  privacyUpdatedAt: '29 de septiembre de 2026',
} as const;
