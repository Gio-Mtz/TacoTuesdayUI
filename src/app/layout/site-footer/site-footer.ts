import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { languageSwitchFor, privacyRoute } from '../../core/i18n/language-switch';
import { PageLangService } from '../../core/i18n/page-lang';
import { SHELL_COPY } from '../../core/i18n/shell-copy';
import { PageSocialMetaService } from '../../core/seo/page-social';
import { SITE_INFO } from '../../core/site/site-info';

@Component({
  selector: 'ttco-site-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './site-footer.html',
  styleUrl: './site-footer.scss',
})
export class SiteFooter {
  private readonly pageLang = inject(PageLangService);

  private readonly social = inject(PageSocialMetaService);

  protected readonly site = SITE_INFO;

  protected readonly copy = computed(() => SHELL_COPY[this.pageLang.lang()]);

  protected readonly privacyLink = computed(() => privacyRoute(this.pageLang.lang()));

  protected readonly privacyLang = this.pageLang.lang;

  // The SAME page in the other language, from the card the router applied -- the
  // same source the header switch reads, so the two can never name different
  // destinations. Null on a route with no twin, and the template falls back to
  // `crossLanguage`, which is a door to the other audience and not a language
  // control: `/` has no Spanish version to offer.
  protected readonly twin = computed(() => languageSwitchFor(this.social.card()));

  protected readonly year = new Date().getFullYear();
}
