import { DOCUMENT, Injectable, inject, signal } from '@angular/core';
import { Meta } from '@angular/platform-browser';

import { environment } from '../../../environments/environment';
import { PageLang } from '../i18n/page-lang';
import MANIFEST from './social-cards.json';

export interface SocialCard {
  readonly route: string;

  readonly dir: string | null;

  readonly lang: PageLang;

  readonly locale: string;

  readonly title: string;
  readonly description: string;

  readonly documentTitle: string;

  readonly image: string;
  readonly imageAlt: string;

  readonly indexable: boolean;

  readonly alternate: SocialCardKey | null;

  // The SAME page in the other language, or null when this route has no
  // translation. Deliberately NOT `alternate`: `/` and `/talento` are each
  // other's hreflang alternates but they are two audiences, not two versions
  // of one text, so sending a visitor between them with a language control
  // would be a lie. This field is what the language switch reads, which is why
  // it is here next to the hreflang data instead of in a list of its own --
  // the visible control and the <link rel="alternate"> tags cannot drift apart
  // if they come from the same card.
  readonly translation: SocialCardKey | null;
}

export type SocialCardKey = 'home' | 'talento' | 'privacidad' | 'privacy' | 'health';

export interface SocialManifest {
  readonly siteName: string;
  readonly siteBaseUrl: string;
  readonly image: { readonly width: number; readonly height: number };
  readonly cards: Readonly<Record<SocialCardKey, SocialCard>>;
}

export const SOCIAL: SocialManifest = MANIFEST as SocialManifest;

export const SOCIAL_CARDS = SOCIAL.cards;

export interface PageSocialData {
  readonly card: SocialCardKey;
}

export function absoluteUrl(path: string, baseUrl: string = environment.siteBaseUrl): string {
  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return path === '/' ? `${base}/` : `${base}${path}`;
}

@Injectable({ providedIn: 'root' })
export class PageSocialMetaService {
  private readonly meta = inject(Meta);
  private readonly documentRef = inject(DOCUMENT);

  private readonly active = signal<SocialCard | null>(null);

  // The card the router last applied. The language switch derives its target
  // from this, so what the control offers is always the card that produced the
  // canonical and hreflang tags on the very same navigation.
  readonly card = this.active.asReadonly();

  apply(card: SocialCard): void {
    this.active.set(card);

    const url = absoluteUrl(card.route);
    const image = absoluteUrl(card.image);

    this.property('og:type', 'website');
    this.property('og:site_name', SOCIAL.siteName);
    this.property('og:title', card.title);
    this.property('og:description', card.description);
    this.property('og:url', url);
    this.property('og:locale', card.locale);
    this.property('og:image', image);
    this.property('og:image:width', String(SOCIAL.image.width));
    this.property('og:image:height', String(SOCIAL.image.height));
    this.property('og:image:alt', card.imageAlt);

    this.named('twitter:card', 'summary_large_image');
    this.named('twitter:title', card.title);
    this.named('twitter:description', card.description);
    this.named('twitter:image', image);
    this.named('twitter:image:alt', card.imageAlt);

    this.named('description', card.description);

    this.named('robots', card.indexable ? 'index, follow' : 'noindex, nofollow');

    this.link('canonical', url, null);
    this.alternates(card);
  }

  private property(name: string, content: string): void {
    this.meta.updateTag({ property: name, content }, `property="${name}"`);
  }

  private named(name: string, content: string): void {
    this.meta.updateTag({ name, content }, `name="${name}"`);
  }

  private alternates(card: SocialCard): void {
    const head = this.documentRef.head;
    head.querySelectorAll('link[rel="alternate"][hreflang]').forEach((element) => element.remove());

    if (!card.alternate) {
      return;
    }

    const other = SOCIAL_CARDS[card.alternate];
    this.link('alternate', absoluteUrl(card.route), card.lang);
    this.link('alternate', absoluteUrl(other.route), other.lang);
    this.link('alternate', absoluteUrl(SOCIAL_CARDS.home.route), 'x-default');
  }

  private link(rel: string, href: string, hreflang: string | null): void {
    const document = this.documentRef;
    const selector = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]`;

    let element = document.head.querySelector<HTMLLinkElement>(selector);
    if (!element) {
      element = document.createElement('link');
      element.setAttribute('rel', rel);
      if (hreflang) {
        element.setAttribute('hreflang', hreflang);
      }
      document.head.appendChild(element);
    }
    element.setAttribute('href', href);
  }
}
