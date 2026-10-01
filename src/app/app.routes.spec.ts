import { Route } from '@angular/router';

import { SHELL_COPY } from './core/i18n/shell-copy';
import { routes } from './app.routes';

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
