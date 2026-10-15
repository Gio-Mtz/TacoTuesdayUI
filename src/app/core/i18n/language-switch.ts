import { PageLang } from './page-lang';
import { SOCIAL_CARDS, SocialCard, SocialCardKey } from '../seo/page-social';

// The name of a language, written IN that language.
export const LANGUAGE_ENDONYM: Readonly<Record<PageLang, string>> = {
  en: 'English',
  'es-MX': 'Español',
} as const;

// Written by hand because nothing in the manifest says "this card is the privacy
// notice". `privacyCardLangsAgree()` is what fails if an entry ever points at a
// card of the wrong language.
export const PRIVACY_CARDS: Readonly<Record<PageLang, SocialCardKey>> = {
  en: 'privacy',
  'es-MX': 'privacidad',
} as const;

export function privacyRoute(lang: PageLang): string {
  return SOCIAL_CARDS[PRIVACY_CARDS[lang]].route;
}

export function privacyCardLangsAgree(): boolean {
  return (Object.keys(PRIVACY_CARDS) as PageLang[]).every(
    (lang) => SOCIAL_CARDS[PRIVACY_CARDS[lang]].lang === lang,
  );
}

export interface LanguageSwitchTarget {
  readonly route: string;

  readonly lang: PageLang;

  readonly label: string;
}

// The target comes from the card's own `translation`, so a route gains or loses
// its language switch with the counterpart and nothing changes here.
export function languageSwitchFor(card: SocialCard | null): LanguageSwitchTarget | null {
  if (!card?.translation) {
    return null;
  }

  const other = SOCIAL_CARDS[card.translation];
  if (!other || other.lang === card.lang) {
    return null;
  }

  return { route: other.route, lang: other.lang, label: LANGUAGE_ENDONYM[other.lang] };
}
