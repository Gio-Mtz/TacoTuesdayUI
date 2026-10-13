import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

import { Candidates } from './sections/candidates/candidates';
import { Companies } from './sections/companies/companies';
import { Hero } from './sections/hero/hero';
import { HowItWorks } from './sections/how-it-works/how-it-works';
import { Waitlist } from './sections/waitlist/waitlist';
import { WAITLIST_SIDE_PARAM, waitlistSideFrom } from './sections/waitlist/waitlist-side';

@Component({
  selector: 'ttco-landing',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Hero, Companies, Candidates, HowItWorks, Waitlist],
  templateUrl: './landing.html',
})
export class Landing {
  private readonly route = inject(ActivatedRoute);

  // The page reads the URL; the form stays dumb and takes an input. That keeps
  // `Waitlist` reusable on `/talento`, which has no query parameter at all.
  protected readonly side = toSignal(
    this.route.queryParamMap.pipe(
      map((params) => waitlistSideFrom(params.get(WAITLIST_SIDE_PARAM))),
    ),
    { initialValue: null },
  );
}
