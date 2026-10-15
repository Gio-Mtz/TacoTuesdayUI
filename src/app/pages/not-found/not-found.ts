import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PageLang, PageLangService } from '../../core/i18n/page-lang';
import { SOCIAL_CARDS, SocialCard, SocialCardKey } from '../../core/seo/page-social';

export interface NotFoundCopy {
  readonly eyebrow: string;
  readonly title: string;
  readonly lede: string;
  readonly doorsLabel: string;
}

export const NOT_FOUND_COPY: Readonly<Record<PageLang, NotFoundCopy>> = {
  en: {
    eyebrow: '404',
    title: 'That page is not here',
    lede: 'The link may be old, or the address may have a slip in it. Nothing is broken — this is everything the site actually has.',
    doorsLabel: 'Every page, each one in its own language',
  },
  'es-MX': {
    eyebrow: '404',
    title: 'Esa página no existe',
    lede: 'Puede que el enlace sea viejo o que a la dirección le falte una letra. No se descompuso nada — esto es todo lo que hay en el sitio.',
    doorsLabel: 'Todas las páginas, cada una en su idioma',
  },
} as const;

// Each page's name written IN that page's language. `null` is a decision, not an
// omission: the record is exhaustive, so a card added to the manifest without a
// line here does not compile.
export const DOOR_LABEL: Readonly<Record<SocialCardKey, string | null>> = {
  home: 'For companies',
  talento: 'Para devs',
  empresas: 'Para empresas',
  privacidad: 'Aviso de privacidad',
  privacy: 'Privacy notice',
  health: null,
  notfound: null,
} as const;

export interface NotFoundDoor {
  readonly route: string;

  readonly lang: PageLang;

  readonly label: string;
}

// Derived from the manifest, filtered by the same `indexable` flag that decides
// what goes in `sitemap.xml`, so the doors cannot drift from the public pages.
export function doorsFrom(
  cards: Readonly<Record<SocialCardKey, SocialCard>> = SOCIAL_CARDS,
): readonly NotFoundDoor[] {
  return (Object.keys(cards) as SocialCardKey[])
    .filter((key) => cards[key].indexable && DOOR_LABEL[key] !== null)
    .map((key) => ({ route: cards[key].route, lang: cards[key].lang, label: DOOR_LABEL[key]! }));
}

// Does NOT print the requested URL back: a 404 that echoes the address is a free
// billboard for anyone who can send a link, and the address bar already holds it.
@Component({
  selector: 'ttco-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './not-found.html',
  styleUrl: './not-found.scss',
})
export class NotFound {
  private readonly pageLang = inject(PageLangService);

  protected readonly copy = computed(() => NOT_FOUND_COPY[this.pageLang.lang()]);

  protected readonly doors: readonly NotFoundDoor[] = doorsFrom();
}
