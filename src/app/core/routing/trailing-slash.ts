import { DefaultUrlSerializer, UrlTree } from '@angular/router';

// Angular reads a trailing slash as a second, empty segment, so `/talento/`
// parses to `['talento', '']` and matches no one-segment route. Fixed in the
// serializer, not with a redirect per page, so a page added later is covered
// without anyone remembering to.
//
// Matches slashes at the END OF THE PATH only: never inside a query or fragment
// (`[^?#]*`), and never the root `/`, which needs one non-slash character first.
const TRAILING_SLASHES = /^(\/[^?#]*[^/?#])\/+(?=[?#]|$)/;

export function withoutTrailingSlash(url: string): string {
  return url.replace(TRAILING_SLASHES, '$1');
}

export class TrailingSlashUrlSerializer extends DefaultUrlSerializer {
  override parse(url: string): UrlTree {
    return super.parse(withoutTrailingSlash(url));
  }
}
