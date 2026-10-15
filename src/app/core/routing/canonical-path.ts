import { Routes, UrlTree } from '@angular/router';

import { TrailingSlashUrlSerializer, withoutTrailingSlash } from './trailing-slash';

// Only a path that is exactly one known segment is normalized. `/Nope` and
// `/Talento/extra` keep the spelling that arrived, so the 404 still answers the
// address that was asked for instead of a rewritten one.
const SINGLE_SEGMENT = /^\/([^/?#]+)$/;

// A link shared by hand picks up the sentence it was written in: the period
// that ends the message, the comma in a list, the space before or after a
// paste. Stripped only from the ENDS, and only when what is left is a page --
// the `known` check below is the lock.
const STRAY_HEAD = /^(?:%20|\s)+/;
const STRAY_TAIL = /(?:%20|\s|[.,!:])+$/;

export function knownFirstSegments(routes: Routes): ReadonlySet<string> {
  const paths = routes
    .map((route) => route.path)
    .filter((path): path is string => typeof path === 'string')
    .filter((path) => path !== '' && path !== '**' && !path.includes('/'))
    .map((path) => path.toLowerCase());

  return new Set(paths);
}

export function withKnownPathCase(url: string, known: ReadonlySet<string>): string {
  const mark = url.search(/[?#]/);
  const path = mark === -1 ? url : url.slice(0, mark);
  const rest = mark === -1 ? '' : url.slice(mark);

  // The query and the fragment are never touched: `?side=` carries a value the
  // form reads back, and an anchor id is case-sensitive in the DOM.
  const bare = withoutTrailingSlash(path);
  const segment = SINGLE_SEGMENT.exec(bare)?.[1];
  if (segment === undefined) {
    return url;
  }

  const canonical = segment.replace(STRAY_HEAD, '').replace(STRAY_TAIL, '').toLowerCase();
  if (canonical === segment || !known.has(canonical)) {
    return url;
  }

  return `/${canonical}${path.slice(bare.length)}${rest}`;
}

export class CanonicalPathUrlSerializer extends TrailingSlashUrlSerializer {
  constructor(private readonly known: ReadonlySet<string>) {
    super();
  }

  override parse(url: string): UrlTree {
    return super.parse(withKnownPathCase(url, this.known));
  }
}
