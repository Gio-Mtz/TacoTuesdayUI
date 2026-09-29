import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * The first screen. It has fifteen seconds to answer "what is this and is it
 * for me", so it carries exactly three things: the promise, one paragraph that
 * makes it concrete, and one door per audience.
 *
 * The two calls to action scroll to the Empresas and Candidatos sections rather
 * than opening a form: the waitlist form lands in US-003, and a button that
 * promises a form that does not exist yet is worse than no button. When US-003
 * ships, these point at it instead.
 */
@Component({
  selector: 'ttco-hero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
})
export class Hero {}
