import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Icon } from '../../../shared/icon/icon';

export interface CompanyValuePoint {
  readonly icon: string;
  readonly title: string;
  readonly body: string;
}

@Component({
  selector: 'ttco-companies',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './companies.html',
  styleUrl: './companies.scss',
})
export class Companies {
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
