import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';

import { environment } from '../../../environments/environment';
import { PageLang } from '../i18n/page-lang';
import MANIFEST from './social-cards.json';

/**
 * One page's social card: what a link to it looks like when somebody pastes it
 * into WhatsApp, LinkedIn or Slack.
 *
 * **Why the data lives in a `.json` file and not in a commented `.ts` like the
 * rest of this folder.** It has two consumers that cannot share a module
 * system: this service, which runs in the browser, and
 * `tools/emit-route-cards.mjs`, a plain Node script that runs after `ng build`
 * and writes the same tags into static HTML for crawlers that never execute
 * JavaScript. Generating one from the other, or typing the strings twice, is the
 * five-copies bug TD-007 existed to kill. JSON is the one format both can read
 * with no build step and no dependency, and the cost — JSON cannot hold
 * comments — is paid here instead, in this docblock.
 *
 * ⚠️ **The copy is SOURCED, not written.** `title` and `description` are the
 * `<h1>` and the lede of the page they describe, verbatim. That is deliberate:
 * US-007's card says the landing's English copy may still be rewritten, so
 * inventing card copy today is work that gets done twice. The only invented
 * string in the manifest is `/privacidad`'s description, and a privacy notice
 * has no marketing copy to contradict.
 */
export interface SocialCard {
  /** The route this card describes, with a leading slash. */
  readonly route: string;

  /**
   * Directory `tools/emit-route-cards.mjs` writes this card's static HTML into,
   * relative to the build output. `null` means the card belongs to
   * `index.html` itself (the root) or that the route is not worth a static file.
   */
  readonly dir: string | null;

  readonly lang: PageLang;

  /** `og:locale`. Underscore form (`es_MX`), which is NOT the `lang` form. */
  readonly locale: string;

  readonly title: string;
  readonly description: string;

  /** `<title>`. Longer than `og:title` is allowed to be, hence a second field. */
  readonly documentTitle: string;

  /** Absolute path of the card image, served from `public/`. */
  readonly image: string;
  readonly imageAlt: string;

  /** `false` emits `<meta name="robots" content="noindex">`. */
  readonly indexable: boolean;

  /** Key of the card in the OTHER language, for `<link rel="alternate">`. */
  readonly alternate: SocialCardKey | null;
}

export type SocialCardKey = 'home' | 'talento' | 'privacidad' | 'health';

export interface SocialManifest {
  readonly siteName: string;
  readonly siteBaseUrl: string;
  readonly image: { readonly width: number; readonly height: number };
  readonly cards: Readonly<Record<SocialCardKey, SocialCard>>;
}

/**
 * The manifest, typed. The `satisfies`-style assertion is what turns a typo in
 * the JSON into a compile error instead of an `undefined` in a meta tag.
 */
export const SOCIAL: SocialManifest = MANIFEST as SocialManifest;

export const SOCIAL_CARDS = SOCIAL.cards;

/** Route `data` contract. A route without this gets no social tags written. */
export interface PageSocialData {
  readonly card: SocialCardKey;
}

/**
 * Joins the site origin and a path into the absolute URL a social crawler
 * needs. `og:url`, `og:image` and `<link rel="canonical">` are **required to be
 * absolute** — a relative `og:image` is simply dropped by every crawler, which
 * is the failure mode where the tag is present, the build is green and the
 * preview still has no picture.
 */
export function absoluteUrl(path: string, baseUrl: string = environment.siteBaseUrl): string {
  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return path === '/' ? `${base}/` : `${base}${path}`;
}

/**
 * Writes the Open Graph, Twitter, canonical and `hreflang` tags of the current
 * page into `<head>` on every navigation.
 *
 * **What this service can and cannot do, stated up front because it decides the
 * whole design.** Angular writes these tags *after* it boots. Every social
 * crawler that matters — Facebook, WhatsApp, LinkedIn, Slack, Twitter — fetches
 * the HTML and reads it **without running JavaScript**. So this service is
 * correct for a human who shares what they are looking at from an in-app
 * browser, and invisible to the crawler that actually draws the preview. The
 * half that crawlers see is `tools/emit-route-cards.mjs`, which bakes the same
 * tags into static per-route HTML at build time. **Neither half is the feature
 * on its own**, and the runtime half exists because `og:url` and `canonical`
 * have to keep up with client-side navigation, which a static file cannot.
 *
 * ⚠️ **`property` vs `name` is the bug this file is shaped around.** Open Graph
 * tags are `<meta property="og:title">`; Twitter's are `<meta
 * name="twitter:title">`. Writing `name="og:title"` produces a tag that looks
 * right in devtools, validates as HTML, passes any test that greps for
 * `og:title` — and is ignored by every Open Graph consumer on earth. Every
 * write below passes an EXPLICIT selector naming the right attribute, and the
 * spec asserts on the attribute, not on the string.
 */
@Injectable({ providedIn: 'root' })
export class PageSocialMetaService {
  private readonly meta = inject(Meta);
  private readonly documentRef = inject(DOCUMENT);

  apply(card: SocialCard): void {
    const url = absoluteUrl(card.route);
    const image = absoluteUrl(card.image);

    // Open Graph. `property`, always.
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

    // Twitter. `name`, always. `summary_large_image` is the 1200x630 card; the
    // default `summary` crops the same image into a small square and the
    // headline inside it becomes unreadable.
    this.named('twitter:card', 'summary_large_image');
    this.named('twitter:title', card.title);
    this.named('twitter:description', card.description);
    this.named('twitter:image', image);
    this.named('twitter:image:alt', card.imageAlt);

    // Plain description, for search engines rather than social cards.
    this.named('description', card.description);

    // robots is written on every navigation, including the indexable case, so
    // that leaving `/health` does not leave `noindex` behind on the next page.
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

  /**
   * `<link rel="alternate" hreflang>` for the page in the other language, plus
   * `x-default` for a crawler that matches neither.
   *
   * It mirrors the rule `ShellCopy.crossLanguage` already follows in the UI:
   * the two landings are the same offer addressed to two audiences, so they are
   * alternates of each other. `/privacidad` has no English twin and therefore
   * gets no alternate at all — announcing a translation that does not exist is
   * worse than announcing nothing.
   */
  private alternates(card: SocialCard): void {
    const head = this.documentRef.head;
    head
      .querySelectorAll('link[rel="alternate"][hreflang]')
      .forEach((element) => element.remove());

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
    const selector = hreflang
      ? `link[rel="${rel}"][hreflang="${hreflang}"]`
      : `link[rel="${rel}"]`;

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
