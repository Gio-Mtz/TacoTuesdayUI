import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Candidates } from './sections/candidates/candidates';
import { Companies } from './sections/companies/companies';
import { Hero } from './sections/hero/hero';
import { HowItWorks } from './sections/how-it-works/how-it-works';

/**
 * The public landing page.
 *
 * It is only an ordering of sections, and that is deliberate: each section owns
 * its own copy and its own layout, so changing what the Empresas pitch says
 * never touches this file, and the order of the argument stays readable in one
 * screen.
 *
 * The order is the argument: what this is (hero) → why it matters to the side
 * that pays (empresas) → why it matters to the side that has to show up
 * (candidatos) → how little it costs to find out (cómo funciona).
 *
 * The waitlist form from US-003 goes after `ttco-how-it-works`, once someone
 * has read the reason to leave their email.
 */
@Component({
  selector: 'ttco-landing',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Hero, Companies, Candidates, HowItWorks],
  templateUrl: './landing.html',
})
export class Landing {}
