import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Candidates } from './sections/candidates/candidates';
import { Companies } from './sections/companies/companies';
import { Hero } from './sections/hero/hero';
import { HowItWorks } from './sections/how-it-works/how-it-works';
import { Waitlist } from './sections/waitlist/waitlist';

@Component({
  selector: 'ttco-landing',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Hero, Companies, Candidates, HowItWorks, Waitlist],
  templateUrl: './landing.html',
})
export class Landing {}
