import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { CONSENT_COPY } from '../../core/analytics/consent-copy';
import { ConsentService } from '../../core/analytics/consent.service';
import { PageLang, PageLangService } from '../../core/i18n/page-lang';
import { SITE_INFO } from '../../core/site/site-info';
import { THEME_COPY } from '../../core/theme/theme-copy';
import { ThemeService } from '../../core/theme/theme.service';

// One component, two languages. The prose branches in the template because
// translated legal text is not reusable markup; everything that is not prose is
// shared, so the policy changes in one place.
export const PRIVACY_CHROME: Readonly<
  Record<PageLang, { readonly eyebrow: string; readonly title: string; readonly updated: string }>
> = {
  en: {
    eyebrow: 'Privacy notice',
    title: 'What we do with your email',
    updated: 'Last updated',
  },
  'es-MX': {
    eyebrow: 'Aviso de privacidad',
    title: 'Qué hacemos con tu correo',
    updated: 'Última actualización',
  },
} as const;

export function formatUpdatedOn(isoDate: string, lang: PageLang): string {
  // timeZone 'UTC' on purpose: the date parses as UTC midnight, and a
  // negative-offset zone -- every zone this site is read from -- prints the 6th.
  return new Intl.DateTimeFormat(lang, { dateStyle: 'long', timeZone: 'UTC' }).format(
    new Date(`${isoDate}T00:00:00Z`),
  );
}

@Component({
  selector: 'ttco-privacy',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './privacy.html',
  styleUrl: './privacy.scss',
})
export class Privacy {
  private readonly consent = inject(ConsentService);

  private readonly pageLang = inject(PageLangService);

  private readonly theme = inject(ThemeService);

  protected readonly site = SITE_INFO;

  protected readonly lang = this.pageLang.lang;

  protected readonly isSpanish = computed(() => this.lang() === 'es-MX');

  protected readonly chrome = computed(() => PRIVACY_CHROME[this.lang()]);

  protected readonly updatedOn = computed(() =>
    formatUpdatedOn(SITE_INFO.privacyUpdatedOn, this.lang()),
  );

  protected readonly copy = computed(() => CONSENT_COPY[this.lang()]);

  protected readonly consentLabel = computed(() => {
    const state = this.consent.state();
    const copy = this.copy();
    if (state === 'granted') {
      return copy.manageGranted;
    }
    return state === 'denied' ? copy.manageDenied : copy.manageUnset;
  });

  protected changeChoice(): void {
    this.consent.reset();
  }

  protected readonly themeCopy = computed(() => THEME_COPY[this.lang()]);

  // The header toggle only moves between light and dark, so 'system' -- the state
  // every visitor arrives in -- has no way back except here.
  protected readonly themeOverridden = computed(() => this.theme.preference() !== 'system');

  protected readonly themeLabel = computed(() => {
    const copy = this.themeCopy();
    const preference = this.theme.preference();
    if (preference === 'light') {
      return copy.manageLight;
    }
    return preference === 'dark' ? copy.manageDark : copy.manageSystem;
  });

  protected useSystemTheme(): void {
    this.theme.useSystem();
  }
}
