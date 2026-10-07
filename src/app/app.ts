import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { PageLangService } from './core/i18n/page-lang';
import { SHELL_COPY } from './core/i18n/shell-copy';
import { SiteFooter } from './layout/site-footer/site-footer';
import { SiteHeader } from './layout/site-header/site-header';
import { CookieBanner } from './shared/cookie-banner/cookie-banner';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, SiteHeader, SiteFooter, CookieBanner],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly pageLang = inject(PageLangService);

  protected readonly copy = computed(() => SHELL_COPY[this.pageLang.lang()]);
}
