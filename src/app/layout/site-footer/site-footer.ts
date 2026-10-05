import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PageLangService } from '../../core/i18n/page-lang';
import { SHELL_COPY } from '../../core/i18n/shell-copy';
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

  protected readonly site = SITE_INFO;

  protected readonly copy = computed(() => SHELL_COPY[this.pageLang.lang()]);

  protected readonly year = new Date().getFullYear();
}
