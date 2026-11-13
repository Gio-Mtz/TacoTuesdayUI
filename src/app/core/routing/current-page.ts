import { SocialCard } from '../seo/page-social';
import { withoutTrailingSlash } from './trailing-slash';

// Crosses the path a shell entry was hand-written with against the route of the
// card the router applied. A page renamed in the manifest stops being marked
// here instead of marking the entry that no longer leads to it.
export function leadsToCurrentPage(path: string, card: SocialCard | null): boolean {
  if (!card) {
    return false;
  }

  return withoutTrailingSlash(path) === withoutTrailingSlash(card.route);
}
