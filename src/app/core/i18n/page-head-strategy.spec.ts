import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, TitleStrategy, provideRouter } from '@angular/router';

import { PageHeadStrategy, resolveLang } from './page-head-strategy';
import { DEFAULT_PAGE_LANG, PageLangService } from './page-lang';

@Component({ template: 'x' })
class Dummy {}

/**
 * These tests are the only thing standing between a route and a wrong `<html
 * lang>`, and a wrong `lang` is invisible: the page looks perfect and a screen
 * reader reads Spanish with English phonemes. Nothing else in the build catches
 * it — which is why the router is driven for real here instead of calling
 * `updateTitle` by hand.
 */
describe('PageHeadStrategy', () => {
  const original = document.documentElement.lang;

  afterEach(() => {
    document.documentElement.lang = original;
  });

  async function navigate(url: string): Promise<void> {
    await TestBed.inject(Router).navigateByUrl(url);
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', title: 'Home', data: { lang: 'en' }, component: Dummy },
          { path: 'aviso', title: 'Aviso', data: { lang: 'es-MX' }, component: Dummy },
          { path: 'sin-lang', title: 'No lang', component: Dummy },
          {
            path: 'padre',
            data: { lang: 'en' },
            children: [{ path: 'hijo', data: { lang: 'es-MX' }, component: Dummy }],
          },
        ]),
        { provide: TitleStrategy, useExisting: PageHeadStrategy },
      ],
    });
  });

  it('is what the router actually uses', () => {
    expect(TestBed.inject(TitleStrategy)).toBeInstanceOf(PageHeadStrategy);
  });

  it('still does the job it inherited: sets the title', async () => {
    await navigate('/aviso');
    expect(document.title).toBe('Aviso');
  });

  it('writes the route language onto <html>', async () => {
    await navigate('/aviso');
    expect(document.documentElement.lang).toBe('es-MX');
  });

  it('changes it back on the next navigation, not just the first', async () => {
    await navigate('/aviso');
    await navigate('/');
    expect(document.documentElement.lang).toBe('en');
  });

  it('publishes the same value to PageLangService, so the shell follows', async () => {
    await navigate('/aviso');
    expect(TestBed.inject(PageLangService).lang()).toBe('es-MX');
  });

  it('falls back to the default for a route that forgot to declare one', async () => {
    await navigate('/sin-lang');
    expect(document.documentElement.lang).toBe(DEFAULT_PAGE_LANG);
  });

  it('lets the deepest route win over its parent', async () => {
    await navigate('/padre/hijo');
    expect(document.documentElement.lang).toBe('es-MX');
  });
});

describe('resolveLang', () => {
  /**
   * A hand-built snapshot chain. `resolveLang` only reads `data` and
   * `firstChild`, so this is the whole contract — and testing it directly is
   * what makes the router tests above about wiring rather than about the walk.
   */
  function chain(...langs: readonly (string | undefined)[]) {
    const nodes = langs.map((lang) => ({
      data: lang ? { lang } : {},
      firstChild: null as unknown,
    }));
    nodes.forEach((node, i) => (node.firstChild = nodes[i + 1] ?? null));
    return nodes[0] as never;
  }

  it('returns the default when nothing declares a language', () => {
    expect(resolveLang(chain(undefined, undefined))).toBe(DEFAULT_PAGE_LANG);
  });

  it('keeps a parent language when the child does not declare one', () => {
    // A layout route that only groups children should not have to repeat the
    // language of every child.
    expect(resolveLang(chain('es-MX', undefined))).toBe('es-MX');
  });

  it('lets the deepest declaration win', () => {
    expect(resolveLang(chain('en', 'es-MX'))).toBe('es-MX');
  });
});
