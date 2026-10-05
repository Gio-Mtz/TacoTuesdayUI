import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Icon } from '../../../shared/icon/icon';

export interface HowItWorksStep {
  readonly icon: string;
  readonly title: string;
  readonly body: string;
}

@Component({
  selector: 'ttco-how-it-works',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './how-it-works.html',
  styleUrl: './how-it-works.scss',
})
export class HowItWorks {
  protected readonly steps: readonly HowItWorksStep[] = [
    {
      icon: 'mail',
      title: 'Leave your email',
      body: 'Tell us whether you are coming as a company or as an engineer. It takes under a minute and we do not ask for anything else yet.',
    },
    {
      icon: 'search',
      title: 'We match you',
      body: 'We line up what the company needs against what the person can actually do. No match, no waste of your time.',
    },
    {
      icon: 'thumbs-up',
      title: 'Interview and answer',
      body: 'An agreed date, an interview and written feedback at the end. For both sides.',
    },
  ];
}
