import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { waitlistSideQuery } from '../waitlist/waitlist-side';

@Component({
  selector: 'ttco-hero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
})
export class Hero {
  // Built from the helper rather than typed into the template, so the name of
  // the parameter lives in exactly one file.
  protected readonly hiringQuery = waitlistSideQuery('company');

  protected readonly engineerQuery = waitlistSideQuery('candidate');
}
