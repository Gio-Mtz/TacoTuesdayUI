import { Route } from '@angular/router';

import { SHELL_COPY } from './core/i18n/shell-copy';
import { routes } from './app.routes';
import { SOCIAL_CARDS, SocialCard, SocialCardKey } from './core/seo/page-social';
import { NotFound } from './pages/not-found/not-found';

describe('routes', () => {
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
    const privacy = pages.find((route) => route.path === 'privacidad');
    expect(privacy?.data?.['lang']).toBe('es-MX');
  });

  it('keeps /talento in Spanish — the whole point of the page', () => {
    const talent = pages.find((route) => route.path === 'talento');
    expect(talent).toBeDefined();
    expect(talent?.data?.['lang']).toBe('es-MX');
  });

  it('keeps the landing in English — the side that pays reads English', () => {
    const landing = pages.find((route) => route.path === '');
    expect(landing?.data?.['lang']).toBe('en');
  });
});

// The catch-all is a route, but it is not a PAGE: it answers every address the
// site does not have, so there is no single path for a card to describe and
// `pathOf` would measure it against `/**`. It is excluded from the manifest
// checks below and gets its own, stricter ones at the bottom of this file --
// excluded on purpose, not forgotten.
const CATCH_ALL = '**';

describe('routes and the social card manifest', () => {
  const declared = routes.filter(
    (route): route is Route & { path: string } =>
      typeof route.path === 'string' && route.path !== CATCH_ALL && route.redirectTo === undefined,
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
    for (const route of declared) {
      expect(cardOf(route).lang).toBe(route.data!['lang']);
    }
  });

  it('keeps the route title byte-for-byte equal to the card documentTitle', () => {
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
    for (const card of Object.values(SOCIAL_CARDS) as SocialCard[]) {
      if (!card.indexable) {
        continue;
      }
      expect(card.dir).toBe(card.route === '/' ? null : card.route.slice(1));
    }
  });
});

describe('the catch-all', () => {
  const catchAll = routes.find((route) => route.path === CATCH_ALL);

  it('exists, because a URL this site does not have still has to answer something', () => {
    expect(catchAll).toBeDefined();
  });

  it('is the last route — a catch-all above a real route eats it', () => {
    expect(routes.at(-1)?.path).toBe(CATCH_ALL);
  });

  // THE regression guard for US-018. It said `redirectTo: ''` until 15-oct, so
  // every wrong address silently became the home page and the address bar
  // rewrote itself. If this ever goes back to a redirect, this fails.
  it('renders a page instead of redirecting to the landing', () => {
    expect(catchAll?.redirectTo).toBeUndefined();
    expect(catchAll?.component).toBe(NotFound);
  });

  it('is not indexable, so one crawler cannot mint endless copies of a page', () => {
    const card = SOCIAL_CARDS[catchAll!.data!['card'] as SocialCardKey];

    expect(card.indexable).toBe(false);
  });

  it('answers in the same language and under the same card as /404', () => {
    const page = routes.find((route) => route.path === '404');

    expect(page).toBeDefined();
    expect(catchAll?.data?.['card']).toBe(page?.data?.['card']);
    expect(catchAll?.data?.['lang']).toBe(page?.data?.['lang']);
    expect(catchAll?.title).toBe(page?.title);
  });
});
