import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Icon } from '../../../shared/icon/icon';

export interface CandidateValuePoint {
  readonly icon: string;
  readonly title: string;
  readonly body: string;
}

@Component({
  selector: 'ttco-candidates',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './candidates.html',
  styleUrl: './candidates.scss',
})
export class Candidates {
  protected readonly points: readonly CandidateValuePoint[] = [
    {
      icon: 'eye',
      title: 'Judged on what you can build',
      body: 'Your stack and what you have shipped go first. No filters asking for 5 years in a technology that is 3 years old.',
    },
    {
      icon: 'bell',
      title: 'You are never left without an answer',
      body: 'You know which step you are on and when the next one happens. If it is a no, you get a no, not three weeks of silence.',
    },
    {
      icon: 'chat',
      title: 'Feedback you can use',
      body: 'What they expected, what they saw and what was missing. In writing, so the next interview goes better.',
    },
  ];
}
