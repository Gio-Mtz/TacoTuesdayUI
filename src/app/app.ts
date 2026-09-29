import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { SiteFooter } from './layout/site-footer/site-footer';
import { SiteHeader } from './layout/site-header/site-header';

/**
 * The app shell: skip link, header, the routed page, footer.
 *
 * Header and footer live here rather than inside the landing because they
 * belong to the site, not to one page — the privacy notice gets the same frame
 * for free, and the theme toggle keeps working wherever the visitor is.
 */
@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, SiteHeader, SiteFooter],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
