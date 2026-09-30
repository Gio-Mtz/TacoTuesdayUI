import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import {
  ActivatedRouteSnapshot,
  DefaultTitleStrategy,
  RouterStateSnapshot,
} from '@angular/router';

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
 * ⚠️ This is the only writer of `document.documentElement.lang` and of
 * `PageLangService`. If a second one ever appears, delete one of them.
 */
@Injectable({ providedIn: 'root' })
export class PageHeadStrategy extends DefaultTitleStrategy {
  private readonly documentRef = inject(DOCUMENT);
  private readonly pageLang = inject(PageLangService);

  constructor() {
    super(inject(Title));
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    super.updateTitle(snapshot);

    const lang = resolveLang(snapshot.root);
    this.documentRef.documentElement.lang = lang;
    this.pageLang.set(lang);
  }
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
