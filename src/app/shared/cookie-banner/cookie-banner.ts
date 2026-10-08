import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CONSENT_COPY } from '../../core/analytics/consent-copy';
import { ConsentService } from '../../core/analytics/consent.service';
import { AnalyticsService } from '../../core/analytics/analytics.service';
import { privacyRoute } from '../../core/i18n/language-switch';
import { PageLangService } from '../../core/i18n/page-lang';

@Component({
  selector: 'ttco-cookie-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './cookie-banner.html',
  styleUrl: './cookie-banner.scss',
})
export class CookieBanner {
  private readonly consent = inject(ConsentService);

  private readonly analytics = inject(AnalyticsService);

  private readonly pageLang = inject(PageLangService);

  protected readonly copy = computed(() => CONSENT_COPY[this.pageLang.lang()]);

  // US-011, and the bug Gio actually reported: the banner inherits English from
  // `/` correctly, but this link was pinned to `/privacidad`, so an English
  // banner sent an English reader to a Spanish page.
  protected readonly privacyLink = computed(() => privacyRoute(this.pageLang.lang()));

  protected readonly privacyLang = this.pageLang.lang;

  protected readonly visible = computed(() => this.analytics.configured && !this.consent.decided());

  protected accept(): void {
    this.consent.grant();
  }

  protected reject(): void {
    this.consent.deny();
  }
}
