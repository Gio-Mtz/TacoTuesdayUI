import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { privacyRoute } from '../../core/i18n/language-switch';
import { PageLangService } from '../../core/i18n/page-lang';
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
}
