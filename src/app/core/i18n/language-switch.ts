import { PageLang } from './page-lang';
import { SOCIAL_CARDS, SocialCard, SocialCardKey } from '../seo/page-social';

// The name of a language, written IN that language. A selector that says
// "Spanish" to someone who only reads Spanish has failed at the one job it has.
export const LANGUAGE_ENDONYM: Readonly<Record<PageLang, string>> = {
  en: 'English',
  'es-MX': 'Español',
} as const;

// GUARD, not documentation: which card is the privacy notice in each language.
// Three places link to the notice -- the cookie banner, the footer and the
// waitlist form -- and before US-011 all three hardcoded `/privacidad`, which is
// the bug Gio reported: an English banner sending an English reader to a Spanish
// page. They now ask for the route of the CURRENT page's language instead.
//
// It is two lines written by hand because nothing in the manifest says "this card
// is the privacy notice". What keeps it honest is `privacyCardLangsAgree()`: if
// either entry ever points at a card of the wrong language, that fails, instead
// of the site quietly linking across languages again.
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

// Derived, not listed: the target comes from the card's own `translation`, so a
// route gets a language switch the moment it declares a counterpart and loses it
// the moment the counterpart goes away. Adding `/talent` in English later is one
// card plus one `translation` -- no change here.
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
