import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PageLangService } from '../../core/i18n/page-lang';
import { SHELL_COPY } from '../../core/i18n/shell-copy';
import { SITE_INFO } from '../../core/site/site-info';
import { ThemeToggle } from '../../shared/theme-toggle/theme-toggle';

/**
 * The site header: wordmark, in-page nav and the theme toggle.
 *
 * The nav uses `routerLink="/"` + `fragment` rather than a bare `href="#…"`.
 * A bare hash only works while you are already on the landing; from
 * `/privacidad` it would scroll to nothing. The fragments are English since
 * US-009 (`companies`, `engineers`, `how-it-works`) because they are the ids of
 * sections on the English page, and they show up in the address bar. Going through the router means the
 * same link lands on the landing first and then scrolls, from anywhere.
 * `withInMemoryScrolling({ anchorScrolling: 'enabled' })` in app.config.ts is
 * what performs the scroll — without it these links navigate and sit still.
 *
 * Below 768 px the nav is hidden and only the wordmark and the toggle remain.
 * That is a decision, not an omission: the landing is a single short page, so
 * scrolling already reaches every section, and a hamburger menu is a focus
 * trap, an overlay and a pile of ARIA for three anchors. It comes back the day
 * there is a second page worth navigating to.
 */
@Component({
  selector: 'ttco-site-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ThemeToggle],
  templateUrl: './site-header.html',
  styleUrl: './site-header.scss',
})
export class SiteHeader {
  private readonly pageLang = inject(PageLangService);

  protected readonly site = SITE_INFO;

  /** Shell copy for the language of the page on screen. See `shell-copy.ts`. */
  protected readonly copy = computed(() => SHELL_COPY[this.pageLang.lang()]);
}
