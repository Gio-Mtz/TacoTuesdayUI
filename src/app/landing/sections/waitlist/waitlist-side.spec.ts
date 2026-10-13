import { WAITLIST_SIDE_PARAM, waitlistSideFrom, waitlistSideQuery } from './waitlist-side';

describe('waitlist side', () => {
  it('keeps the parameter name in one place, because three files read it', () => {
    expect(WAITLIST_SIDE_PARAM).toBe('side');
  });

  it('accepts the two sides of the marketplace, spelled as the API spells them', () => {
    expect(waitlistSideFrom('company')).toBe('company');
    expect(waitlistSideFrom('candidate')).toBe('candidate');
  });

  it('says nothing rather than guessing when the visitor did not say', () => {
    expect(waitlistSideFrom(null)).toBeNull();
    expect(waitlistSideFrom(undefined)).toBeNull();
    expect(waitlistSideFrom('')).toBeNull();
  });

  it('refuses junk instead of letting it reach the form or GA4', () => {
    // A crawler, a stale link or a typo must land on the default form, never on
    // a broken one -- and `lead_kind` must never carry a value the API has
    // never heard of.
    for (const junk of ['Company', 'engineer', 'dev', 'empresa', 'candidato', 'true', '1', '<x>']) {
      expect(waitlistSideFrom(junk)).toBeNull();
    }
  });

  it('builds the link object from the same constant', () => {
    expect(waitlistSideQuery('company')).toEqual({ [WAITLIST_SIDE_PARAM]: 'company' });
    expect(waitlistSideQuery('candidate')).toEqual({ [WAITLIST_SIDE_PARAM]: 'candidate' });
  });
});
