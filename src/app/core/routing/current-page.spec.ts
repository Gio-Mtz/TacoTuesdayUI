import { SOCIAL_CARDS, SocialCardKey } from '../seo/page-social';
import { leadsToCurrentPage } from './current-page';

const KEYS = Object.keys(SOCIAL_CARDS) as SocialCardKey[];

describe('leadsToCurrentPage', () => {
  it('marks a path that is the route of the card the router applied', () => {
    for (const key of KEYS) {
      const card = SOCIAL_CARDS[key];
      expect(leadsToCurrentPage(card.route, card)).toBe(true);
    }
  });

  it('leaves every OTHER route unmarked, for every card in the manifest', () => {
    for (const key of KEYS) {
      const card = SOCIAL_CARDS[key];
      const others = KEYS.filter((other) => SOCIAL_CARDS[other].route !== card.route);

      for (const other of others) {
        expect(leadsToCurrentPage(SOCIAL_CARDS[other].route, card)).toBe(false);
      }
    }
  });

  it('marks nothing before a card has been applied', () => {
    for (const key of KEYS) {
      expect(leadsToCurrentPage(SOCIAL_CARDS[key].route, null)).toBe(false);
    }
  });

  // The serializer strips a trailing slash before the router sees it, so a shell
  // entry written with one still names the page the visitor is on.
  it('reads a trailing slash as the same page', () => {
    const card = SOCIAL_CARDS.companies;

    expect(leadsToCurrentPage(`${card.route}/`, card)).toBe(true);
    expect(leadsToCurrentPage('/', SOCIAL_CARDS.home)).toBe(true);
  });

  it('does not take a longer path that merely starts the same', () => {
    const card = SOCIAL_CARDS.companies;

    expect(leadsToCurrentPage(`${card.route}-es`, card)).toBe(false);
    expect(leadsToCurrentPage(`${card.route}/extra`, card)).toBe(false);
  });
});
