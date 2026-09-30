import { Injectable, signal } from '@angular/core';

/**
 * The languages this site is written in. Not a locale list and not an i18n
 * setup: exactly the two languages that exist as real pages.
 *
 * US-009 decided the shape of this: `/` speaks English to the company that pays,
 * `/talento` will speak Spanish to the engineer (US-010), and `/privacidad` is a
 * Mexican aviso de privacidad and therefore Spanish by law, not by preference.
 * They are DIFFERENT TEXTS, not translations of each other — which is why there
 * is no `@angular/localize`, no `transloco` and no language selector anywhere in
 * this repo, and why adding one later would be a regression, not a feature.
 */
export type PageLang = 'en' | 'es-MX';

/**
 * What `src/index.html` ships with, and therefore what a crawler that does not
 * run JavaScript sees on EVERY route.
 *
 * Static Web Apps serves the same `index.html` for every path, so `lang` in the
 * static file can only be right for one language. It is `en` because `/` is the
 * page that gets indexed and shared. The Spanish routes are corrected by
 * `PageHeadStrategy` the moment the router resolves them — correct for every
 * real browser and every screen reader, and wrong for a JS-less crawler reading
 * `/privacidad`. That is the trade, written down so nobody rediscovers it.
 */
export const DEFAULT_PAGE_LANG: PageLang = 'en';

/** Route `data` contract. A route without this gets `DEFAULT_PAGE_LANG`. */
export interface PageLangData {
  readonly lang: PageLang;
}

/**
 * The language of the page currently on screen.
 *
 * It exists because the app shell — skip link, header nav, footer — is shared by
 * pages in both languages, so its copy cannot be a constant. Written by
 * `PageHeadStrategy` (one writer, on navigation), read by the shell components
 * as a signal, which is what repaints them under `OnPush` with no zone.
 */
@Injectable({ providedIn: 'root' })
export class PageLangService {
  private readonly current = signal<PageLang>(DEFAULT_PAGE_LANG);

  readonly lang = this.current.asReadonly();

  set(lang: PageLang): void {
    this.current.set(lang);
  }
}
