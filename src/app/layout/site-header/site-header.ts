import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PageLangService } from '../../core/i18n/page-lang';
import { SHELL_COPY } from '../../core/i18n/shell-copy';
import { leadsToCurrentPage } from '../../core/routing/current-page';
import { PageSocialMetaService } from '../../core/seo/page-social';
import { SITE_INFO } from '../../core/site/site-info';
import { LanguageSwitch } from '../../shared/language-switch/language-switch';
import { ThemeToggle } from '../../shared/theme-toggle/theme-toggle';

@Component({
  selector: 'ttco-site-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LanguageSwitch, ThemeToggle],
  templateUrl: './site-header.html',
  styleUrl: './site-header.scss',
})
export class SiteHeader {
  private readonly pageLang = inject(PageLangService);

  private readonly social = inject(PageSocialMetaService);

  protected readonly site = SITE_INFO;

  protected readonly copy = computed(() => SHELL_COPY[this.pageLang.lang()]);

  // The flag is resolved here, not in the template: a call in the binding would
  // re-run on every change detection pass of every entry.
  protected readonly nav = computed(() => {
    const card = this.social.card();

    return this.copy().nav.map((link) => ({
      ...link,
      current: leadsToCurrentPage(link.path, card),
    }));
  });
}
