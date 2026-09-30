import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { PageLangService } from './core/i18n/page-lang';
import { SHELL_COPY } from './core/i18n/shell-copy';
import { SiteFooter } from './layout/site-footer/site-footer';
import { SiteHeader } from './layout/site-header/site-header';

/**
 * The app shell: skip link, header, the routed page, footer.
 *
 * Header and footer live here rather than inside the landing because they
 * belong to the site, not to one page — the privacy notice gets the same frame
 * for free, and the theme toggle keeps working wherever the visitor is.
 *
 * Since US-009 the frame is also the only part of the site that exists in two
 * languages at once, so its copy comes from `SHELL_COPY` keyed by the current
 * route's `lang` instead of being typed into the template.
 */
@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, SiteHeader, SiteFooter],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly pageLang = inject(PageLangService);

  protected readonly copy = computed(() => SHELL_COPY[this.pageLang.lang()]);
}
