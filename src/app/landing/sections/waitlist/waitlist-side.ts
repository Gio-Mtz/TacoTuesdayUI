import { LeadKind } from '../../../api/Leads/ILead';

/**
 * Which side of the marketplace the visitor said they were on, carried in the
 * URL so that the hero's two doors open two different forms.
 *
 * GUARD, not documentation: before US-013 the hero's two buttons were
 * `routerLink="/" fragment="waitlist"` -- both of them, byte for byte. So an
 * engineer who clicked "I'm looking for work" landed on a form that said
 * *Company* and asked, as a required field, for the name of their company.
 * That is friction on the one action this sprint exists to measure, and it also
 * tilts `lead_kind` -- the GA4 dimension US-012 had just shipped -- towards
 * `company` for every engineer who did not notice the radio.
 *
 * Why a query parameter and not something else, so nobody re-litigates it:
 *   - **Not a second fragment.** `#waitlist` is what scrolls the form into view
 *     (`anchorScrolling: 'enabled'`, app.config.ts). A fragment that matches no
 *     element id scrolls nowhere, so spending the fragment on the audience
 *     would cost the scroll.
 *   - **Not a second route.** A route needs a card in `social-cards.json`, an
 *     entry in the sitemap and an hreflang pair -- three guards' worth of
 *     surface for a page whose content is identical.
 *   - **A query parameter survives copy-paste**, which is the whole point: the
 *     link a hiring manager forwards to an engineer has to open the engineer's
 *     form, not theirs.
 */
export const WAITLIST_SIDE_PARAM = 'side';

/**
 * The accepted values are the `LeadKind`s themselves, on purpose: the value in
 * the URL, the value posted to `/api/leads` and the value reported to GA4 as
 * `lead_kind` are then the same string, and there is no translation table to
 * drift.
 *
 * Anything else -- absent, empty, a typo, a crawler appending junk -- returns
 * `null`, which means "the visitor did not say", and the form keeps the
 * default it has always had. An unknown value must never be an error page.
 */
export function waitlistSideFrom(value: string | null | undefined): LeadKind | null {
  return value === 'company' || value === 'candidate' ? value : null;
}

/** The `queryParams` object for a link that opens the form on `kind`'s side. */
export function waitlistSideQuery(kind: LeadKind): Readonly<Record<string, string>> {
  return { [WAITLIST_SIDE_PARAM]: kind };
}
