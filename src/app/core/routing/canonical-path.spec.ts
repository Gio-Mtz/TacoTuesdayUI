import { TestBed } from '@angular/core/testing';
import { Router, UrlSerializer, provideRouter } from '@angular/router';

import { routes } from '../../app.routes';
import {
  CanonicalPathUrlSerializer,
  knownFirstSegments,
  withKnownPathCase,
} from './canonical-path';

describe('knownFirstSegments', () => {
  const known = knownFirstSegments(routes);

  it('picks up every real page, so a page added later is covered without an edit here', () => {
    expect(known.has('talento')).toBe(true);
    expect(known.has('empresas')).toBe(true);
    expect(known.has('privacidad')).toBe(true);
    expect(known.has('privacy')).toBe(true);
    expect(known.has('health')).toBe(true);
  });

  it('leaves out the home and the catch-all, which are not segments to re-case', () => {
    expect(known.has('')).toBe(false);
    expect(known.has('**')).toBe(false);
  });
});

describe('withKnownPathCase', () => {
  const known = new Set(['talento', 'privacy', 'privacidad', 'health']);

  it('lands a page whose address arrived capitalized', () => {
    expect(withKnownPathCase('/Talento', known)).toBe('/talento');
    expect(withKnownPathCase('/TALENTO', known)).toBe('/talento');
    expect(withKnownPathCase('/TaLeNtO', known)).toBe('/talento');
    expect(withKnownPathCase('/Privacy', known)).toBe('/privacy');
    expect(withKnownPathCase('/PRIVACIDAD', known)).toBe('/privacidad');
    expect(withKnownPathCase('/Health', known)).toBe('/health');
  });

  it('leaves an address that was already right exactly as it is', () => {
    expect(withKnownPathCase('/talento', known)).toBe('/talento');
    expect(withKnownPathCase('/', known)).toBe('/');
    expect(withKnownPathCase('', known)).toBe('');
  });

  it('does NOT re-case a path that is not a page — the 404 answers what was asked', () => {
    expect(withKnownPathCase('/NoExiste', known)).toBe('/NoExiste');
    expect(withKnownPathCase('/Talent', known)).toBe('/Talent');
    expect(withKnownPathCase('/Talento/extra', known)).toBe('/Talento/extra');
  });

  it('keeps the query untouched — `side` carries a value the form reads back', () => {
    expect(withKnownPathCase('/Talento?side=Dev', known)).toBe('/talento?side=Dev');
    expect(withKnownPathCase('/talento?next=/Talento', known)).toBe('/talento?next=/Talento');
  });

  it('keeps the fragment untouched — an anchor id is case-sensitive in the DOM', () => {
    expect(withKnownPathCase('/Talento#Lista-De-Espera', known)).toBe('/talento#Lista-De-Espera');
    expect(withKnownPathCase('/privacy#A/b', known)).toBe('/privacy#A/b');
  });

  it('lands a page whose address picked up the sentence that carried it', () => {
    expect(withKnownPathCase('/talento.', known)).toBe('/talento');
    expect(withKnownPathCase('/talento,', known)).toBe('/talento');
    expect(withKnownPathCase('/talento!', known)).toBe('/talento');
    expect(withKnownPathCase('/talento:', known)).toBe('/talento');
    expect(withKnownPathCase('/privacy.', known)).toBe('/privacy');
    expect(withKnownPathCase('/privacidad.', known)).toBe('/privacidad');
  });

  it('lands a page whose address arrived with a stray space, encoded or not', () => {
    expect(withKnownPathCase('/talento%20', known)).toBe('/talento');
    expect(withKnownPathCase('/talento ', known)).toBe('/talento');
    expect(withKnownPathCase('/%20talento', known)).toBe('/talento');
    expect(withKnownPathCase('/ talento', known)).toBe('/talento');
  });

  it('takes the capital and the sentence mark together, in one pass', () => {
    expect(withKnownPathCase('/Talento.', known)).toBe('/talento');
    expect(withKnownPathCase('/ PRIVACIDAD ', known)).toBe('/privacidad');
  });

  it('does NOT strip a mark off a path that is not a page — the 404 answers what was asked', () => {
    expect(withKnownPathCase('/NoExiste.', known)).toBe('/NoExiste.');
    expect(withKnownPathCase('/Talent.', known)).toBe('/Talent.');
    expect(withKnownPathCase('/talento.extra', known)).toBe('/talento.extra');
    expect(withKnownPathCase('/.', known)).toBe('/.');
  });

  it('leaves a mark that is INSIDE the segment alone — only the ends are stray', () => {
    expect(withKnownPathCase('/tal.ento', known)).toBe('/tal.ento');
    expect(withKnownPathCase('/privacidád', known)).toBe('/privacidád');
  });

  it('keeps a mark in the query or the fragment, where it carries meaning', () => {
    expect(withKnownPathCase('/talento.?side=Dev.', known)).toBe('/talento?side=Dev.');
    expect(withKnownPathCase('/talento.#lista.', known)).toBe('/talento#lista.');
  });

  it('composes with the trailing slash instead of fighting it', () => {
    expect(withKnownPathCase('/Talento/', known)).toBe('/talento/');
    expect(withKnownPathCase('/TALENTO//', known)).toBe('/talento//');
  });
});

describe('CanonicalPathUrlSerializer', () => {
  const serializer = new CanonicalPathUrlSerializer(knownFirstSegments(routes));

  it('parses the capitalized URL into the same tree as the clean one', () => {
    expect(serializer.parse('/Talento').toString()).toBe(serializer.parse('/talento').toString());
  });

  it('still drops the trailing slash it inherits', () => {
    expect(serializer.parse('/Talento/').toString()).toBe(serializer.parse('/talento').toString());
  });

  it('gives a URL that is nobody a tree of its own, not the home page', () => {
    expect(serializer.parse('/NoExiste').toString()).toBe('/NoExiste');
  });
});

describe('the router, end to end', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        {
          provide: UrlSerializer,
          useFactory: () => new CanonicalPathUrlSerializer(knownFirstSegments(routes)),
        },
      ],
    });
  });

  async function landOn(url: string): Promise<{ path: string | undefined; final: string }> {
    const router = TestBed.inject(Router);
    await router.navigateByUrl(url);

    return {
      path: router.routerState.snapshot.root.firstChild?.routeConfig?.path,
      final: router.url,
    };
  }

  it('takes a capitalized address to its page and corrects the bar', async () => {
    expect(await landOn('/Talento')).toEqual({ path: 'talento', final: '/talento' });
    expect(await landOn('/TALENTO')).toEqual({ path: 'talento', final: '/talento' });
    expect(await landOn('/Privacy')).toEqual({ path: 'privacy', final: '/privacy' });
    expect(await landOn('/PRIVACIDAD')).toEqual({ path: 'privacidad', final: '/privacidad' });
  });

  it('takes a capitalized address with a trailing slash too', async () => {
    expect(await landOn('/Talento/')).toEqual({ path: 'talento', final: '/talento' });
  });

  it('keeps the fragment the waitlist links depend on', async () => {
    const { path, final } = await landOn('/Talento#lista-de-espera');

    expect(path).toBe('talento');
    expect(final).toBe('/talento#lista-de-espera');
  });

  it('takes an address that arrived inside a sentence to its page', async () => {
    expect(await landOn('/talento.')).toEqual({ path: 'talento', final: '/talento' });
    expect(await landOn('/privacy.')).toEqual({ path: 'privacy', final: '/privacy' });
    expect(await landOn('/Talento.')).toEqual({ path: 'talento', final: '/talento' });
    expect(await landOn('/talento%20')).toEqual({ path: 'talento', final: '/talento' });
  });

  it('still sends a URL that is nobody to the 404, at the address that was asked', async () => {
    expect(await landOn('/NoExiste')).toEqual({ path: '**', final: '/NoExiste' });
    expect(await landOn('/Talento/extra')).toEqual({ path: '**', final: '/Talento/extra' });
    expect(await landOn('/NoExiste.')).toEqual({ path: '**', final: '/NoExiste.' });
  });

  it('does not disturb the pages that were already right', async () => {
    expect(await landOn('/talento')).toEqual({ path: 'talento', final: '/talento' });
    expect(await landOn('/')).toEqual({ path: '', final: '/' });
  });
});
