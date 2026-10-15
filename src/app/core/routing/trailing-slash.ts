import { DefaultUrlSerializer, UrlTree } from '@angular/router';

// `/talento/` and `/talento` name the same page, and until now only one of them
// knew it. Angular reads a trailing slash as a SECOND, empty segment, so
// `/talento/` parses to `['talento', '']` -- two segments offered to a
// one-segment route, no match, straight into the catch-all.
//
// Measured on `main` (`037b6b7`) before this file existed, not assumed:
// `router.parseUrl('/talento/')` returned the segments `talento|`, and the
// catch-all's `redirectTo: ''` then put a Spanish reader on the ENGLISH landing
// page with no explanation. `/privacy/` behaved the same way.
//
// That slash is not a typo a visitor makes. Chat apps, address bars and
// copy-paste append it on their own, so the person who pays for it is the one
// who shared the link CORRECTLY.
//
// It is fixed in the serializer rather than with one redirect route per page
// because the defect is in how a URL is read, not in which routes exist: a page
// added later is covered the day it is added, with nothing to remember. The
// router also re-serializes the tree it parsed, so the address bar corrects
// itself to `/talento` instead of keeping a URL that disagrees with the page.

// The slashes at the END OF THE PATH, and nothing else: never inside a query or
// a fragment (`[^?#]*`), and never the root `/`, which needs at least one
// non-slash character before the match can start.
const TRAILING_SLASHES = /^(\/[^?#]*[^/?#])\/+(?=[?#]|$)/;

export function withoutTrailingSlash(url: string): string {
  return url.replace(TRAILING_SLASHES, '$1');
}

export class TrailingSlashUrlSerializer extends DefaultUrlSerializer {
  override parse(url: string): UrlTree {
    return super.parse(withoutTrailingSlash(url));
  }
}
