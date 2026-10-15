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

// The name of each page, written IN that page's language -- the same rule the
// language switch follows, and for the same reason: a Spanish reader who landed
// here by accident should not have to read English to find the way out.
//
// `null` is a DECISION, not an omission, and the type is what keeps it one: this
// is an exhaustive `Record<SocialCardKey, …>`, so a card added to the manifest
// without a line here does not compile. `/health` is an internal screen and
// `/404` is this page; neither is a door.
export const DOOR_LABEL: Readonly<Record<SocialCardKey, string | null>> = {
  home: 'For companies',
  talento: 'Para devs',
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

// Derived, not listed: the doors come from the manifest, filtered by the same
// `indexable` flag that decides what goes in `sitemap.xml`. A public page added
// later shows up here the day its card does, and a page that stops being public
// loses its door in the same commit that makes it private.
export function doorsFrom(
  cards: Readonly<Record<SocialCardKey, SocialCard>> = SOCIAL_CARDS,
): readonly NotFoundDoor[] {
  return (Object.keys(cards) as SocialCardKey[])
    .filter((key) => cards[key].indexable && DOOR_LABEL[key] !== null)
    .map((key) => ({ route: cards[key].route, lang: cards[key].lang, label: DOOR_LABEL[key]! }));
}

// US-018. Two things were true of every address this site does not have, and
// both of them were invisible from inside the code:
//
//   1. The catch-all said `redirectTo: ''`, so a wrong URL silently BECAME the
//      home page. The visitor was never told, and the address bar quietly
//      rewrote itself, which is the one place a person looks to find the typo.
//   2. Azure answers those URLs with the app shell and a 200, so a crawler was
//      being offered the home page's indexable content at an unlimited number of
//      addresses.
//
// This page answers (1) by existing, and (2) with its card: `indexable: false`
// makes `PageSocialMetaService` emit `noindex, nofollow` on whatever URL the
// visitor actually hit.
//
// What it deliberately does NOT do is print that URL back. A 404 page that
// echoes the address is a free billboard for anyone who can send a link, and
// the visitor can already read the address bar -- which, now that the catch-all
// no longer redirects, still holds what they asked for.
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
