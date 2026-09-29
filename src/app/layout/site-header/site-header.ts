import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SITE_INFO } from '../../core/site/site-info';
import { ThemeToggle } from '../../shared/theme-toggle/theme-toggle';

/**
 * The site header: wordmark, in-page nav and the theme toggle.
 *
 * The nav uses `routerLink="/"` + `fragment` rather than a bare `href="#…"`.
 * A bare hash only works while you are already on the landing; from
 * `/privacidad` it would scroll to nothing. Going through the router means the
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
  protected readonly site = SITE_INFO;
}
