import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { CONSENT_COPY } from '../../core/analytics/consent-copy';
import { ConsentService } from '../../core/analytics/consent.service';
import { PageLang, PageLangService } from '../../core/i18n/page-lang';
import {
  CollectedFieldInfo,
  collectedFields,
} from '../../landing/sections/waitlist/collected-fields';
import { SITE_INFO } from '../../core/site/site-info';
import { WAITLIST_COPY } from '../../landing/sections/waitlist/waitlist-copy';
import { THEME_COPY } from '../../core/theme/theme-copy';
import { ThemeService } from '../../core/theme/theme.service';

// One component, two languages. The prose branches in the template because
// translated legal text is not reusable markup; everything that is not prose is
// shared, so the policy changes in one place.
export interface PrivacyChrome {
  readonly eyebrow: string;
  readonly title: string;
  readonly updated: string;

  readonly collectedTitle: string;
  readonly collectedLede: string;
  readonly collectedAlways: string;
  readonly collectedCompanyOnly: string;
  readonly collectedCandidateOnly: string;
  readonly collectedNothingElse: string;
}

export const PRIVACY_CHROME: Readonly<Record<PageLang, PrivacyChrome>> = {
  en: {
    eyebrow: 'Privacy notice',
    title: 'What we do with your email',
    updated: 'Last updated',

    collectedTitle: 'What we collect',
    collectedLede: 'Only what you type into the waitlist form — these fields and no others:',
    collectedAlways: 'asked of everyone',
    collectedCompanyOnly: 'only if you join as a company',
    collectedCandidateOnly: 'only if you join as a candidate',
    collectedNothingElse:
      'That is the whole form. We do not ask for documents, a phone number or an address, and nothing is added to it behind the screen.',
  },
  'es-MX': {
    eyebrow: 'Aviso de privacidad',
    title: 'Qué hacemos con tu correo',
    updated: 'Última actualización',

    collectedTitle: 'Qué recogemos',
    collectedLede:
      'Sólo lo que escribes tú en el formulario de la lista de espera — estos campos y ningún otro:',
    collectedAlways: 'se te pide siempre',
    collectedCompanyOnly: 'sólo si entras como empresa',
    collectedCandidateOnly: 'sólo si entras como candidato',
    collectedNothingElse:
      'Ese es todo el formulario. No pedimos documentos, ni teléfono, ni dirección, y no se le agrega nada detrás de la pantalla.',
  },
} as const;

export function formatUpdatedOn(isoDate: string, lang: PageLang): string {
  // timeZone 'UTC' on purpose: the date parses as UTC midnight, and a
  // negative-offset zone -- every zone this site is read from -- prints the 6th.
  return new Intl.DateTimeFormat(lang, { dateStyle: 'long', timeZone: 'UTC' }).format(
    new Date(`${isoDate}T00:00:00Z`),
  );
}

export function whenAsked(field: CollectedFieldInfo, chrome: PrivacyChrome): string {
  if (field.askedOf === 'company') {
    return chrome.collectedCompanyOnly;
  }
  return field.askedOf === 'candidate' ? chrome.collectedCandidateOnly : chrome.collectedAlways;
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

  // The section used to name three fields the form never asked for -- how much
  // you hire per year, your main stack, your years of experience. Read from the
  // form's own declaration so the notice cannot describe a different form again.
  // Resolved here and not in the template: a call in the binding would re-run on
  // every change detection pass, once per field.
  protected readonly collected = computed(() => {
    const chrome = this.chrome();
    const lang = this.lang();

    // The form's own "(optional)" marker, so a field the visitor may leave blank
    // reads the same way here as next to the input.
    const optional = WAITLIST_COPY[lang].roleOptional;

    return collectedFields(lang).map((field) => ({
      ...field,
      optional: field.required ? null : optional,
      when: whenAsked(field, chrome),
    }));
  });

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
