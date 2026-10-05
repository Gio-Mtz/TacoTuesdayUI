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
