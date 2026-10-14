import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Icon } from '../../../shared/icon/icon';
import { waitlistSideQuery } from '../waitlist/waitlist-side';

export interface CompanyValuePoint {
  readonly icon: string;
  readonly title: string;
  readonly body: string;
}

@Component({
  selector: 'ttco-companies',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, RouterLink],
  templateUrl: './companies.html',
  styleUrl: './companies.scss',
})
export class Companies {
  // Built from the helper and not typed into the template, for the same reason
  // as the hero's: the name of the parameter lives in exactly one file.
  protected readonly hiringQuery = waitlistSideQuery('company');

  protected readonly points: readonly CompanyValuePoint[] = [
    {
      icon: 'calendar',
      title: 'No more chasing calendars',
      body: 'Candidates book from your real availability. Not one more email asking whether Thursday works.',
    },
    {
      icon: 'filter',
      title: 'Signal, not a pretty résumé',
      body: 'Every profile arrives with what the person has actually shipped and the stack they shipped it in, not three pages of adjectives.',
    },
    {
      icon: 'check-circle',
      title: 'Every interview leaves a record',
      body: 'Written feedback you can compare across candidates. When someone asks why that yes and that no, the answer is already written down.',
    },
  ];
}
