import { TestBed } from '@angular/core/testing';

import {
  PageSocialMetaService,
  SOCIAL,
  SOCIAL_CARDS,
  SocialCard,
  absoluteUrl,
} from './page-social';

describe('PageSocialMetaService', () => {
  let service: PageSocialMetaService;

  function head(selector: string): Element | null {
    return document.head.querySelector(selector);
  }

  function content(selector: string): string | null {
    return head(selector)?.getAttribute('content') ?? null;
  }

  beforeEach(() => {
    document.head
      .querySelectorAll('meta[property], meta[name], link[rel="canonical"], link[rel="alternate"]')
      .forEach((element) => element.remove());
    service = TestBed.inject(PageSocialMetaService);
  });

  it('writes Open Graph on `property`, never on `name`', () => {
    service.apply(SOCIAL_CARDS.home);

    expect(content('meta[property="og:title"]')).toBe(SOCIAL_CARDS.home.title);
    expect(head('meta[name="og:title"]')).toBeNull();
  });

  it('writes Twitter on `name`, never on `property`', () => {
    service.apply(SOCIAL_CARDS.home);

    expect(content('meta[name="twitter:title"]')).toBe(SOCIAL_CARDS.home.title);
    expect(head('meta[property="twitter:title"]')).toBeNull();
    expect(content('meta[name="twitter:card"]')).toBe('summary_large_image');
  });

  it('makes og:url and og:image absolute, because a relative one is dropped', () => {
    service.apply(SOCIAL_CARDS.talento);

    expect(content('meta[property="og:url"]')).toMatch(/^https?:\/\//);
    expect(content('meta[property="og:image"]')).toMatch(/^https?:\/\//);
    expect(content('meta[property="og:image"]')).toContain(SOCIAL_CARDS.talento.image);
  });

  it('replaces tags on the second navigation instead of appending a second set', () => {
    service.apply(SOCIAL_CARDS.home);
    service.apply(SOCIAL_CARDS.talento);

    expect(document.head.querySelectorAll('meta[property="og:title"]').length).toBe(1);
    expect(content('meta[property="og:title"]')).toBe(SOCIAL_CARDS.talento.title);
    expect(document.head.querySelectorAll('link[rel="canonical"]').length).toBe(1);
  });

  it('points canonical at the page itself', () => {
    service.apply(SOCIAL_CARDS.talento);

    expect(head('link[rel="canonical"]')?.getAttribute('href')).toBe(
      absoluteUrl(SOCIAL_CARDS.talento.route),
    );
  });

  it('declares both languages plus x-default when the page has a twin', () => {
    service.apply(SOCIAL_CARDS.home);

    const alternates = [...document.head.querySelectorAll('link[rel="alternate"][hreflang]')].map(
      (link) => [link.getAttribute('hreflang'), link.getAttribute('href')],
    );

    expect(alternates).toContainEqual(['en', absoluteUrl('/')]);
    expect(alternates).toContainEqual(['es-MX', absoluteUrl('/talento')]);
    expect(alternates).toContainEqual(['x-default', absoluteUrl('/')]);
  });

  it('announces no translation for a page that has none', () => {
    // Was /privacidad until US-011 gave it an English counterpart. /health is
    // the card that genuinely has no alternate, and is noindex anyway.
    service.apply(SOCIAL_CARDS.health);

    expect(document.head.querySelectorAll('link[rel="alternate"][hreflang]').length).toBe(0);
  });

  it('clears the alternates left by the previous page', () => {
    service.apply(SOCIAL_CARDS.home);
    service.apply(SOCIAL_CARDS.health);

    expect(document.head.querySelectorAll('link[rel="alternate"][hreflang]').length).toBe(0);
  });

  it('pairs the two privacy notices, which is what US-011 added', () => {
    service.apply(SOCIAL_CARDS.privacidad);

    const alternates = Array.from(
      document.head.querySelectorAll('link[rel="alternate"][hreflang]'),
    ).map((link) => [link.getAttribute('hreflang'), link.getAttribute('href')]);

    expect(alternates).toContainEqual(['es-MX', absoluteUrl('/privacidad')]);
    expect(alternates).toContainEqual(['en', absoluteUrl('/privacy')]);
  });

  it('remembers the card it applied, so the language switch reads the same one', () => {
    service.apply(SOCIAL_CARDS.privacy);
    expect(service.card()).toBe(SOCIAL_CARDS.privacy);

    service.apply(SOCIAL_CARDS.home);
    expect(service.card()).toBe(SOCIAL_CARDS.home);
  });

  it('writes robots on every page, so noindex cannot leak out of /health', () => {
    service.apply(SOCIAL_CARDS.health);
    expect(content('meta[name="robots"]')).toBe('noindex, nofollow');

    service.apply(SOCIAL_CARDS.home);
    expect(content('meta[name="robots"]')).toBe('index, follow');
  });
});

describe('absoluteUrl', () => {
  it('keeps exactly one slash between origin and path', () => {
    expect(absoluteUrl('/talento', 'https://example.test')).toBe('https://example.test/talento');
    expect(absoluteUrl('/talento', 'https://example.test/')).toBe('https://example.test/talento');
  });

  it('renders the root as a bare trailing slash, which is the canonical form', () => {
    expect(absoluteUrl('/', 'https://example.test')).toBe('https://example.test/');
  });
});

describe('the social card manifest', () => {
  const cards = Object.values(SOCIAL_CARDS) as SocialCard[];

  it('has an absolute https origin with no trailing slash', () => {
    expect(SOCIAL.siteBaseUrl).toMatch(/^https:\/\/[^/]+$/);
  });

  it('gives every card a route that starts at the root', () => {
    for (const card of cards) {
      expect(card.route.startsWith('/')).toBe(true);
    }
  });

  it('keeps og:title inside what a preview will actually show', () => {
    for (const card of cards) {
      expect(card.title.length).toBeLessThanOrEqual(70);
      expect(card.description.length).toBeLessThanOrEqual(200);
    }
  });

  it('points every alternate at a card that exists, in the other language', () => {
    for (const card of cards) {
      if (!card.alternate) {
        continue;
      }
      const other = SOCIAL_CARDS[card.alternate];
      expect(other).toBeDefined();
      expect(other.lang).not.toBe(card.lang);
    }
  });

  it('uses the underscore locale form, which is not the lang form', () => {
    for (const card of cards) {
      expect(card.locale).toMatch(/^[a-z]{2}_[A-Z]{2}$/);
      expect(card.locale.replace('_', '-')).toBe(
        card.lang.includes('-') ? card.lang : `${card.lang}-US`,
      );
    }
  });

  it('names an image that the build actually ships', () => {
    for (const card of cards) {
      expect(card.image).toMatch(/^\/og\/[a-z-]+\.png$/);
    }
  });
});
