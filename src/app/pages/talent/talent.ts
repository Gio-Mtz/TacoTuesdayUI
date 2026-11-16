import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { privacyRoute } from '../../core/i18n/language-switch';
import { SITE_INFO } from '../../core/site/site-info';
import { PageLangService } from '../../core/i18n/page-lang';
import { askedFieldsPhrase } from '../../landing/sections/waitlist/asked-fields';
import { Waitlist } from '../../landing/sections/waitlist/waitlist';
import { Icon } from '../../shared/icon/icon';
import { TALENT_COPY } from './talent-copy';

// One component, two routes, two languages: `/engineers` and `/talento` are the
// same argument, so the prose lives in `talent-copy.ts` and the route decides
// which of the two is rendered. Adding a language means adding a key there, not
// a second component.
@Component({
  selector: 'ttco-talent',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, Waitlist],
  templateUrl: './talent.html',
  styleUrl: './talent.scss',
})
export class Talent {
  private readonly pageLang = inject(PageLangService);

  protected readonly copy = computed(() => TALENT_COPY[this.pageLang.lang()]);

  // Read from the card manifest, not written here: the English page must never
  // send a reader to the Spanish notice.
  protected readonly privacyRoute = computed(() => privacyRoute(this.pageLang.lang()));

  // The same source the footer and the notice read. The answer that promises
  // deletion names the mechanism, so it has to hand over the address too, and
  // it may not carry a second copy of it.
  protected readonly site = SITE_INFO;

  // This page's own form is the candidate side; the exit leads to the company
  // one, so the two phrases name different field sets on purpose.
  private readonly ownFields = computed(() => askedFieldsPhrase(this.pageLang.lang(), 'candidate'));

  protected readonly steps = computed(() =>
    this.copy().steps.map((step) =>
      step.asksFields ? { ...step, body: `${step.body} ${this.ownFields()}.` } : step,
    ),
  );

  protected readonly faq = computed(() =>
    this.copy().faq.map((item) =>
      item.asksFields ? { ...item, answer: `${item.answer} ${this.ownFields()}.` } : item,
    ),
  );

  protected readonly crossoverBody = computed(
    () => `${this.copy().crossoverBody} ${askedFieldsPhrase(this.pageLang.lang(), 'company')}.`,
  );
}
