import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PageLangService } from '../../core/i18n/page-lang';
import { SHELL_COPY } from '../../core/i18n/shell-copy';
import { SITE_INFO } from '../../core/site/site-info';

/**
 * The site footer: who to write to, the privacy notice and the year.
 *
 * The privacy link is not decoration. From the moment the landing captures an
 * email (US-003) the notice is a legal requirement in Mexico, and the address
 * shown here is the same one the notice names as the channel to ask for
 * deletion — which is why both read from `SITE_INFO` instead of being typed
 * twice.
 */
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

  /** Shell copy for the language of the page on screen. See `shell-copy.ts`. */
  protected readonly copy = computed(() => SHELL_COPY[this.pageLang.lang()]);

  /**
   * Read once at construction. A footer that renders "2026" for someone whose
   * tab has been open since December is a smaller problem than a signal that
   * recomputes on every change detection for a number that moves once a year.
   */
  protected readonly year = new Date().getFullYear();
}
