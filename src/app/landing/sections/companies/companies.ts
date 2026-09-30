import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Icon } from '../../../shared/icon/icon';

/** One pain, named the way a hiring manager would name it, and the answer. */
export interface CompanyValuePoint {
  readonly icon: string;
  readonly title: string;
  readonly body: string;
}

/**
 * The "For companies" section: the problem this solves for the side that pays.
 *
 * Written as pain first, feature second, on purpose. "Integrated scheduling"
 * means nothing to someone who has not yet admitted that coordinating calendars
 * is eating their week; "stop chasing calendars" does.
 *
 * ⚠️ `brand.md` asks for numbers over adjectives, and there are none here on
 * purpose: nothing has shipped yet, so every number would be invented. What
 * replaces them is *checkable commitments* ("written feedback", "from your real
 * availability") — a promise a client can hold us to, not a metric we made up.
 * The day there are real numbers, they belong in these three bodies.
 */
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
