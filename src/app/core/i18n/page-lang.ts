import { Injectable, signal } from '@angular/core';

export type PageLang = 'en' | 'es-MX';

export const DEFAULT_PAGE_LANG: PageLang = 'en';

export interface PageLangData {
  readonly lang: PageLang;
}

@Injectable({ providedIn: 'root' })
export class PageLangService {
  private readonly current = signal<PageLang>(DEFAULT_PAGE_LANG);

  readonly lang = this.current.asReadonly();

  set(lang: PageLang): void {
    this.current.set(lang);
  }
}
