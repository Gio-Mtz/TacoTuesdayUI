import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Candidates } from './sections/candidates/candidates';
import { Companies } from './sections/companies/companies';
import { Hero } from './sections/hero/hero';
import { HowItWorks } from './sections/how-it-works/how-it-works';
import { Waitlist } from './sections/waitlist/waitlist';

/**
 * The public landing page.
 *
 * It is only an ordering of sections, and that is deliberate: each section owns
 * its own copy and its own layout, so changing what the companies pitch says
 * never touches this file, and the order of the argument stays readable in one
 * screen.
 *
 * The order is the argument: what this is (hero) → why it matters to the side
 * that pays (companies) → why it matters to the side that has to show up
 * (engineers) → how little it costs to find out (how it works) → the ask
 * (waitlist).
 *
 * Since US-009 every word on this page is English, aimed at the company that
 * pays. The engineers section is still here and still addressed to the engineer;
 * US-010 gives that audience `/talento` in Spanish, and this page keeps a short
 * English version of it, because "we do not ghost your candidates" is also
 * something the buyer wants to hear.
 *
 * The form is last on purpose. It is the only thing on the page that asks for
 * something, and it comes after every reason to say yes has been given. The
 * hero's two buttons jump straight down to it for the visitor who already
 * knows.
 */
@Component({
  selector: 'ttco-landing',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Hero, Companies, Candidates, HowItWorks, Waitlist],
  templateUrl: './landing.html',
})
export class Landing {}
