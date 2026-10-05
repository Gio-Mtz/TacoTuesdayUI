import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import {
  ActivatedRouteSnapshot,
  DefaultTitleStrategy,
  RouterStateSnapshot,
} from '@angular/router';

import {
  PageSocialData,
  PageSocialMetaService,
  SOCIAL_CARDS,
  SocialCardKey,
} from '../seo/page-social';
import { DEFAULT_PAGE_LANG, PageLang, PageLangService } from './page-lang';

/**
 * Sets the document title AND `<html lang>` on every navigation.
 *
 * **Why the title strategy and not an effect on router events.** The router
 * already calls exactly one hook, exactly once, at exactly the moment the new
 * page's route data is resolved and before it is shown — that hook is
 * `TitleStrategy.updateTitle`. Writing a second subscriber to `NavigationEnd` to
 * do the other half of the same job means two mechanisms that can disagree about
 * which route is current, which is the bug you only see on a fast back-button.
 * So `lang` rides along with `title`: same trigger, same snapshot, no ordering.
 *
 * `super.updateTitle` keeps the standard `title` behaviour — including that a
 * route with no `title` leaves the previous one alone — so this class adds
 * `lang` and changes nothing else.
 *
 * Since US-007 it also writes the page's social card — Open Graph, Twitter,
 * canonical, `hreflang` — through `PageSocialMetaService`, and for the same
 * reason `lang` is here: `og:url` and `canonical` are per-page facts that have
 * to change on client-side navigation, and this is the one hook that fires once
 * per navigation with the resolved route in hand. Three jobs, one trigger, one
 * snapshot, nothing to get out of order.
 *
 * ⚠️ This is the only writer of `document.documentElement.lang`, of
 * `PageLangService` and of the social tags. If a second one ever appears,
 * delete one of them.
 */
@Injectable({ providedIn: 'root' })
export class PageHeadStrategy extends DefaultTitleStrategy {
  private readonly documentRef = inject(DOCUMENT);
  private readonly pageLang = inject(PageLangService);
  private readonly social = inject(PageSocialMetaService);

  constructor() {
    super(inject(Title));
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    super.updateTitle(snapshot);

    const lang = resolveLang(snapshot.root);
    this.documentRef.documentElement.lang = lang;
    this.pageLang.set(lang);

    const card = resolveCard(snapshot.root);
    if (card) {
      this.social.apply(SOCIAL_CARDS[card]);
    }
  }
}

/**
 * The social card of the deepest primary route that declares one, or `null`.
 *
 * `null` leaves whatever is in `<head>` alone rather than writing an empty
 * card. A route with no card is a route nobody shares — and a half-written card
 * (title of the new page, image of the old one) is a worse preview than a stale
 * one that is at least internally consistent.
 */
export function resolveCard(root: ActivatedRouteSnapshot): SocialCardKey | null {
  let route: ActivatedRouteSnapshot | null = root;
  let card: SocialCardKey | null = null;

  while (route) {
    const declared = (route.data as Partial<PageSocialData>).card;
    if (declared) {
      card = declared;
    }
    route = route.firstChild;
  }

  return card;
}

/**
 * The `lang` of the deepest primary route that declares one.
 *
 * Deepest wins so a future nested route can override its parent, and the walk
 * remembers the last value it saw rather than requiring every level to declare
 * one — a layout route that only groups children should not have to repeat the
 * language of its children.
 */
export function resolveLang(root: ActivatedRouteSnapshot): PageLang {
  let route: ActivatedRouteSnapshot | null = root;
  let lang = DEFAULT_PAGE_LANG;

  while (route) {
    const declared = route.data['lang'] as PageLang | undefined;
    if (declared) {
      lang = declared;
    }
    route = route.firstChild;
  }

  return lang;
}
