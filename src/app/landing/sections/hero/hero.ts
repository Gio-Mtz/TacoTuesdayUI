import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * The first screen. It has fifteen seconds to answer "what is this and is it
 * for me", so it carries exactly three things: the promise, one paragraph that
 * makes it concrete, and one door per audience.
 *
 * Both calls to action now scroll to the waitlist form (US-003). They point at
 * the same anchor and differ only in wording: the form's first question is
 * which side you are on, so sending "Estoy contratando" somewhere else would
 * only mean asking twice. Splitting them again would need the form to preselect
 * the variant from the fragment, which is a query-param feature dressed up as a
 * hash and is not worth it for one radio button.
 *
 * The Empresas and Candidatos sections are still reachable — from the header
 * nav, which is where someone browsing rather than converting will look.
 *
 * ## The eyebrow does not name the city, and that is the decision
 *
 * It read `Engineering hires, from Guadalajara` through US-009, on the reading
 * that `brand.md` calls the origin the differentiator. Gio, as stakeholder, said
 * it earned nothing there — and `brand.md` agrees more than that first reading
 * did: it assigns the origin to **the colour and the mark**, and the seriousness
 * to the typography and the restraint. A geographic claim in the line above the
 * `<h1>` was the logo's job done twice, in the one place where a VP of
 * Engineering in Austin can read it as "local agency" in three seconds.
 *
 * So the eyebrow now does the job an eyebrow is for: it names the audience. `/`
 * speaks to the company that pays, and four words say so before the promise
 * does. The origin is still on the page — in the agave, in the palette and in
 * the footer's `Made in Guadalajara, Mexico.`, which is a credit line and not a
 * positioning claim. `hero.spec.ts` holds a tripwire on this.
 */
@Component({
  selector: 'ttco-hero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
})
export class Hero {}
