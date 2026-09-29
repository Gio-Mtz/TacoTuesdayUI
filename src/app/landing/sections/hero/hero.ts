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
 */
@Component({
  selector: 'ttco-hero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
})
export class Hero {}
