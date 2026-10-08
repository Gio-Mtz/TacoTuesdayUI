import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { CONSENT_COPY } from '../../core/analytics/consent-copy';
import { ConsentService } from '../../core/analytics/consent.service';
import { PageLang, PageLangService } from '../../core/i18n/page-lang';
import { SITE_INFO } from '../../core/site/site-info';

// US-011: one component, two languages. The prose branches in the template
// because translated legal text is not reusable markup -- the sentences differ,
// the inline links differ, and pretending otherwise would mean a mini renderer
// for `<strong>` and `<code>`. Everything that is NOT prose -- the consent
// widget, the mailbox, the last-updated date -- is shared, so there is exactly
// one place to change when the policy changes.
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
  // timeZone: 'UTC' on purpose. `new Date('2026-10-07')` is UTC midnight, and
  // formatting that in a negative-offset zone -- which is every zone this site
  // is read from -- would print the 6th.
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

  protected readonly site = SITE_INFO;

  protected readonly lang = this.pageLang.lang;

  protected readonly isSpanish = computed(() => this.lang() === 'es-MX');

  protected readonly chrome = computed(() => PRIVACY_CHROME[this.lang()]);

  protected readonly updatedOn = computed(() =>
    formatUpdatedOn(SITE_INFO.privacyUpdatedOn, this.lang()),
  );

  // Was hardcoded to es-MX. On the English notice that would have printed the
  // Spanish consent widget underneath English prose.
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
}
