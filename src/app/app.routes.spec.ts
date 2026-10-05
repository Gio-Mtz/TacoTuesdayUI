import { Route } from '@angular/router';

import { SHELL_COPY } from './core/i18n/shell-copy';
import { routes } from './app.routes';
import { SOCIAL_CARDS, SocialCard, SocialCardKey } from './core/seo/page-social';

/**
 * A trip wire, not a behaviour test.
 *
 * `lang` lives in route `data`, and route `data` is an untyped bag at runtime:
 * a new route that forgets it, or spells it `es_MX`, compiles, builds, renders
 * perfectly and is read aloud in the wrong language. `satisfies PageLangData`
 * catches a typo in a literal but cannot force a route to HAVE the property.
 * This does.
 */
describe('routes', () => {
  /**
   * Every route that renders a page. The `**` catch-all renders nothing.
   *
   * Compared against `undefined` and not truthiness: its `redirectTo` is `''`,
   * which is falsy, so `!route.redirectTo` quietly counted the redirect as a
   * page and this file's first run reported `['**']` as a route missing a
   * language. The empty string is a legitimate redirect target — the landing.
   */
  const pages: readonly Route[] = routes.filter((route) => route.redirectTo === undefined);

  it('has at least the three pages this test is worth writing for', () => {
    expect(pages.length).toBeGreaterThanOrEqual(3);
  });

  it('declares a language on every page', () => {
    const missing = pages.filter((route) => !route.data?.['lang']).map((route) => route.path);
    expect(missing).toEqual([]);
  });

  it('only uses languages the shell has copy for', () => {
    const known = Object.keys(SHELL_COPY);
    const unknown = pages
      .map((route) => route.data?.['lang'] as string)
      .filter((lang) => !known.includes(lang));
    expect(unknown).toEqual([]);
  });

  it('gives every page a title, since the strategy sets title and lang together', () => {
    const untitled = pages.filter((route) => !route.title).map((route) => route.path);
    expect(untitled).toEqual([]);
  });

  it('keeps the privacy notice in Spanish — it is a Mexican aviso de privacidad', () => {
    // Not style: the LFPDPPP addresses a Spanish-speaking data subject. If this
    // ever flips to 'en', the notice stopped being the notice.
    const privacy = pages.find((route) => route.path === 'privacidad');
    expect(privacy?.data?.['lang']).toBe('es-MX');
  });

  it('keeps /talento in Spanish — the whole point of the page', () => {
    // US-010. If this ever flips to 'en', the brand line in its <h1> is being
    // read aloud with English phonemes and the page has stopped being the page
    // devs get sent to.
    const talent = pages.find((route) => route.path === 'talento');
    expect(talent).toBeDefined();
    expect(talent?.data?.['lang']).toBe('es-MX');
  });

  it('keeps the landing in English — the side that pays reads English', () => {
    const landing = pages.find((route) => route.path === '');
    expect(landing?.data?.['lang']).toBe('en');
  });
});

/**
 * The route table and `social-cards.json` describe the same pages twice — once
 * for the browser, once for the static HTML a crawler receives — and nothing in
 * the compiler makes them agree. This block is that agreement.
 *
 * It is worth its length because the failure is invisible: rename a page and
 * forget the manifest, and the site keeps working while WhatsApp shows the old
 * headline for the rest of the year. US-007.
 */
describe('routes and the social card manifest', () => {
  const declared = routes.filter(
    (route): route is Route & { path: string } =>
      typeof route.path === 'string' && route.redirectTo === undefined,
  );

  function pathOf(route: Route & { path: string }): string {
    return route.path === '' ? '/' : `/${route.path}`;
  }

  function cardOf(route: Route & { path: string }): SocialCard {
    return SOCIAL_CARDS[route.data!['card'] as SocialCardKey];
  }

  it('gives every page a card', () => {
    const missing = declared.filter((route) => !route.data?.['card']).map(pathOf);
    expect(missing).toEqual([]);
  });

  it('matches each card to the route it claims to describe', () => {
    for (const route of declared) {
      expect(cardOf(route), `unknown card key on "${pathOf(route)}"`).toBeDefined();
      expect(cardOf(route).route).toBe(pathOf(route));
    }
  });

  it('keeps the card language and the route language identical', () => {
    // Two spellings of one fact. If they disagree, the static file a crawler
    // reads and the page a browser renders claim different languages for one URL.
    for (const route of declared) {
      expect(cardOf(route).lang).toBe(route.data!['lang']);
    }
  });

  it('keeps the route title byte-for-byte equal to the card documentTitle', () => {
    // The browser takes `<title>` from this table; the crawler takes it from the
    // manifest, baked in by `tools/emit-route-cards.mjs`. One page, one title —
    // or a search result and a browser tab that disagree about the same URL.
    for (const route of declared) {
      expect(cardOf(route).documentTitle).toBe(route.title);
    }
  });

  it('leaves no card describing a route that no longer exists', () => {
    const paths = new Set(declared.map(pathOf));
    for (const card of Object.values(SOCIAL_CARDS) as SocialCard[]) {
      expect(paths.has(card.route), `card for "${card.route}" has no route`).toBe(true);
    }
  });

  it('emits a static file for every indexable route except the root', () => {
    // The root IS `index.html`. Everything else needs its own file or Static Web
    // Apps answers it with the root's card — which is the whole bug US-007 fixes.
    for (const card of Object.values(SOCIAL_CARDS) as SocialCard[]) {
      if (!card.indexable) {
        continue;
      }
      expect(card.dir).toBe(card.route === '/' ? null : card.route.slice(1));
    }
  });
});
