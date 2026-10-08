import {
  LANGUAGE_ENDONYM,
  PRIVACY_CARDS,
  languageSwitchFor,
  privacyCardLangsAgree,
  privacyRoute,
} from './language-switch';
import { PageLang } from './page-lang';
import { SOCIAL, SOCIAL_CARDS, SocialCard, SocialCardKey } from '../seo/page-social';

const LANGS: readonly PageLang[] = ['en', 'es-MX'];

describe('the language pairing in social-cards.json', () => {
  const keys = Object.keys(SOCIAL_CARDS) as SocialCardKey[];

  it('points every translation at a card that exists', () => {
    keys.forEach((key) => {
      const target = SOCIAL_CARDS[key].translation;
      if (target) {
        expect(SOCIAL_CARDS[target], `${key} points at translation "${target}"`).toBeDefined();
      }
    });
  });

  it('is symmetric, so a page can always get back to where it came from', () => {
    keys.forEach((key) => {
      const target = SOCIAL_CARDS[key].translation;
      if (target) {
        expect(SOCIAL_CARDS[target].translation, `${key} -> ${target} -> back`).toBe(key);
      }
    });
  });

  it('never pairs a card with one in its own language', () => {
    keys.forEach((key) => {
      const target = SOCIAL_CARDS[key].translation;
      if (target) {
        expect(SOCIAL_CARDS[target].lang, `${key} and its translation ${target}`).not.toBe(
          SOCIAL_CARDS[key].lang,
        );
      }
    });
  });

  it('declares the two privacy notices as each other, which is what US-011 added', () => {
    expect(SOCIAL_CARDS.privacidad.translation).toBe('privacy');
    expect(SOCIAL_CARDS.privacy.translation).toBe('privacidad');
    expect(SOCIAL_CARDS.privacy.route).toBe('/privacy');
    expect(SOCIAL_CARDS.privacy.lang).toBe('en');
  });

  it('leaves / and /talento unpaired on purpose — two audiences, not two translations', () => {
    expect(SOCIAL_CARDS.home.translation).toBeNull();
    expect(SOCIAL_CARDS.talento.translation).toBeNull();
  });

  it('makes the English notice the hreflang alternate of the Spanish one', () => {
    expect(SOCIAL_CARDS.privacidad.alternate).toBe('privacy');
    expect(SOCIAL_CARDS.privacy.alternate).toBe('privacidad');
  });

  it('keeps every indexable card reachable by a route', () => {
    Object.values(SOCIAL.cards)
      .filter((card) => card.indexable)
      .forEach((card) => expect(card.route.startsWith('/')).toBe(true));
  });
});

describe('languageSwitchFor', () => {
  it('offers nothing when the route has no translation', () => {
    expect(languageSwitchFor(SOCIAL_CARDS.home)).toBeNull();
    expect(languageSwitchFor(SOCIAL_CARDS.talento)).toBeNull();
    expect(languageSwitchFor(SOCIAL_CARDS.health)).toBeNull();
  });

  it('offers nothing before the router has applied a card', () => {
    expect(languageSwitchFor(null)).toBeNull();
  });

  it('sends the Spanish notice to the English one, named in English', () => {
    expect(languageSwitchFor(SOCIAL_CARDS.privacidad)).toEqual({
      route: '/privacy',
      lang: 'en',
      label: 'English',
    });
  });

  it('sends the English notice to the Spanish one, named in Spanish', () => {
    expect(languageSwitchFor(SOCIAL_CARDS.privacy)).toEqual({
      route: '/privacidad',
      lang: 'es-MX',
      label: 'Español',
    });
  });

  // Probed at the reverse, like every other guard in this repo: a pair that
  // claims a translation in its own language is a mislabelled card, and the
  // control has to stay hidden instead of offering a language that is not there.
  it('refuses a pair that points at its own language', () => {
    const broken = { ...SOCIAL_CARDS.privacidad, translation: 'talento' } as SocialCard;
    expect(SOCIAL_CARDS.talento.lang).toBe(broken.lang);
    expect(languageSwitchFor(broken)).toBeNull();
  });

  it('names every language in that language, which is the point of a selector', () => {
    expect(LANGUAGE_ENDONYM.en).toBe('English');
    expect(LANGUAGE_ENDONYM['es-MX']).toBe('Español');
    LANGS.forEach((lang) => expect(LANGUAGE_ENDONYM[lang].length).toBeGreaterThan(0));
  });
});

describe('privacyRoute', () => {
  it('agrees with the card it names, in both languages', () => {
    expect(privacyCardLangsAgree()).toBe(true);
    LANGS.forEach((lang) => expect(SOCIAL_CARDS[PRIVACY_CARDS[lang]].lang).toBe(lang));
  });

  it('keeps an English page on an English notice and a Spanish page on a Spanish one', () => {
    expect(privacyRoute('en')).toBe('/privacy');
    expect(privacyRoute('es-MX')).toBe('/privacidad');
  });

  it('covers every language the shell can be in, so no page falls back silently', () => {
    LANGS.forEach((lang) => expect(PRIVACY_CARDS[lang]).toBeDefined());
  });
});
