import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PageLangService } from '../../core/i18n/page-lang';
import { SHELL_COPY } from '../../core/i18n/shell-copy';
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

  protected readonly site = SITE_INFO;

  protected readonly copy = computed(() => SHELL_COPY[this.pageLang.lang()]);
}
