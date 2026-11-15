import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PageLangService } from '../../core/i18n/page-lang';
import { askedFieldsPhrase } from '../../landing/sections/waitlist/asked-fields';
import { Waitlist } from '../../landing/sections/waitlist/waitlist';
import { Icon } from '../../shared/icon/icon';
import { EMPLOYERS_COPY } from './employers-copy';

// One component, two routes, two languages: `/companies` and `/empresas` are
// the same argument, so the prose lives in `employers-copy.ts` and the route
// decides which of the two is rendered. Adding a language means adding a key
// there, not a second component.
@Component({
  selector: 'ttco-employers',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, Waitlist],
  templateUrl: './employers.html',
  styleUrl: './employers.scss',
})
export class Employers {
  private readonly pageLang = inject(PageLangService);

  protected readonly copy = computed(() => EMPLOYERS_COPY[this.pageLang.lang()]);

  // This page's own form is the company side; the exit leads to the candidate
  // one, so the two phrases name different field sets on purpose.
  private readonly ownFields = computed(() => askedFieldsPhrase(this.pageLang.lang(), 'company'));

  protected readonly steps = computed(() =>
    this.copy().steps.map((step) =>
      step.asksFields ? { ...step, body: `${step.body} ${this.ownFields()}.` } : step,
    ),
  );

  protected readonly crossoverBody = computed(
    () => `${this.copy().crossoverBody} ${askedFieldsPhrase(this.pageLang.lang(), 'candidate')}.`,
  );
}
