import { TrailingSlashUrlSerializer, withoutTrailingSlash } from './trailing-slash';

describe('withoutTrailingSlash', () => {
  const serializer = new TrailingSlashUrlSerializer();

  it('drops the slash that turns a page into a dead URL', () => {
    expect(withoutTrailingSlash('/talento/')).toBe('/talento');
    expect(withoutTrailingSlash('/privacy/')).toBe('/privacy');
    expect(withoutTrailingSlash('/privacidad/')).toBe('/privacidad');
  });

  it('leaves the root alone — `/` is not a page with a stray slash, it IS the page', () => {
    expect(withoutTrailingSlash('/')).toBe('/');
  });

  it('leaves a URL that never had one alone', () => {
    expect(withoutTrailingSlash('/talento')).toBe('/talento');
    expect(withoutTrailingSlash('')).toBe('');
  });

  it('keeps the fragment, which is the half the waitlist links depend on', () => {
    expect(withoutTrailingSlash('/talento/#lista-de-espera')).toBe('/talento#lista-de-espera');
    expect(withoutTrailingSlash('/talento#lista-de-espera')).toBe('/talento#lista-de-espera');
  });

  it('keeps the query, and does not touch a slash inside it', () => {
    expect(withoutTrailingSlash('/talento/?side=dev')).toBe('/talento?side=dev');
    expect(withoutTrailingSlash('/talento?next=/talento/')).toBe('/talento?next=/talento/');
  });

  it('does not touch a slash inside the fragment either', () => {
    expect(withoutTrailingSlash('/privacy#a/b/')).toBe('/privacy#a/b/');
  });

  it('collapses more than one, because a doubled paste is still the same page', () => {
    expect(withoutTrailingSlash('/talento//')).toBe('/talento');
  });

  it('keeps a deeper path intact up to its last real segment', () => {
    expect(withoutTrailingSlash('/a/b/')).toBe('/a/b');
  });

  it('parses the slashed URL into the same tree as the clean one', () => {
    expect(serializer.parse('/talento/').toString()).toBe(serializer.parse('/talento').toString());
  });

  it('gives the slashed URL the segment count the route expects — one, not two', () => {
    const segments = serializer.parse('/talento/').root.children['primary'].segments;

    expect(segments.map((segment) => segment.path)).toEqual(['talento']);
  });
});
