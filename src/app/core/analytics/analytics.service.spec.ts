import { TestBed } from '@angular/core/testing';

import { CONSENT_STORAGE_KEY } from './consent';
import { ConsentService } from './consent.service';
import { ANALYTICS_MEASUREMENT_ID, AnalyticsService, GTAG_SCRIPT_ID } from './analytics.service';

const REAL_ID = 'G-ABC1234567';

interface Created {
  readonly analytics: AnalyticsService;
  readonly consent: ConsentService;
}

function create(measurementId: string): Created {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [{ provide: ANALYTICS_MEASUREMENT_ID, useValue: measurementId }],
  });
  return {
    analytics: TestBed.inject(AnalyticsService),
    consent: TestBed.inject(ConsentService),
  };
}

function scriptTags(): HTMLScriptElement[] {
  return Array.from(document.querySelectorAll<HTMLScriptElement>(`#${GTAG_SCRIPT_ID}`));
}

function dataLayer(): unknown[][] {
  return ((window as unknown as { dataLayer?: unknown[][] }).dataLayer ??= []);
}

describe('AnalyticsService', () => {
  beforeEach(() => {
    localStorage.clear();
    scriptTags().forEach((tag) => tag.remove());
    delete (window as unknown as { dataLayer?: unknown[][] }).dataLayer;
    delete (window as unknown as { gtag?: unknown }).gtag;
  });

  afterEach(() => {
    localStorage.clear();
    scriptTags().forEach((tag) => tag.remove());
    delete (window as unknown as { dataLayer?: unknown[][] }).dataLayer;
    delete (window as unknown as { gtag?: unknown }).gtag;
  });

  describe('before anyone has chosen', () => {
    it('loads nothing — this is the whole promise the banner makes', () => {
      const { analytics } = create(REAL_ID);
      analytics.sync();
      expect(analytics.isLoaded()).toBe(false);
      expect(scriptTags()).toHaveLength(0);
    });
  });

  describe('when consent is granted', () => {
    it('injects exactly one gtag script, pointed at the configured id', () => {
      const { analytics, consent } = create(REAL_ID);
      consent.grant();
      analytics.sync();

      const tags = scriptTags();
      expect(tags).toHaveLength(1);
      expect(tags[0].src).toBe(`https://www.googletagmanager.com/gtag/js?id=${REAL_ID}`);
      expect(tags[0].async).toBe(true);
    });

    it('denies every advertising purpose and only grants analytics storage', () => {
      const { analytics, consent } = create(REAL_ID);
      consent.grant();
      analytics.sync();

      const theDefault = dataLayer().find((entry) => entry[0] === 'consent' && entry[1] === 'default');
      expect(theDefault?.[2]).toEqual({
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'granted',
      });
    });

    it('configures GA4 with the IP anonymised and Google signals off', () => {
      const { analytics, consent } = create(REAL_ID);
      consent.grant();
      analytics.sync();

      const config = dataLayer().find((entry) => entry[0] === 'config');
      expect(config?.[1]).toBe(REAL_ID);
      expect(config?.[2]).toEqual({
        anonymize_ip: true,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
      });
    });

    it('is idempotent — syncing again does not duplicate the tag', () => {
      const { analytics, consent } = create(REAL_ID);
      consent.grant();
      analytics.sync();
      analytics.sync();
      analytics.sync();
      expect(scriptTags()).toHaveLength(1);
    });
  });

  describe('when consent is denied', () => {
    it('loads nothing', () => {
      const { analytics, consent } = create(REAL_ID);
      consent.deny();
      analytics.sync();
      expect(analytics.isLoaded()).toBe(false);
    });

    it('tells an already-loaded gtag to deny analytics storage', () => {
      const { analytics, consent } = create(REAL_ID);
      consent.grant();
      analytics.sync();

      consent.deny();
      analytics.sync();

      const update = dataLayer().find((entry) => entry[0] === 'consent' && entry[1] === 'update');
      expect(update?.[2]).toEqual({
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'denied',
      });
    });

    it('does not load on the next visit either', () => {
      localStorage.setItem(CONSENT_STORAGE_KEY, 'denied');
      const { analytics } = create(REAL_ID);
      analytics.sync();
      expect(analytics.isLoaded()).toBe(false);
    });
  });

  describe('the id guard, pointed at something impossible', () => {
    it('reports an empty id as unconfigured — this is what ships until Gio pastes the real one', () => {
      const { analytics } = create('');
      expect(analytics.configured).toBe(false);
    });

    it('refuses to load even with consent granted, when the id is not a GA4 id', () => {
      const { analytics, consent } = create('G-XXXXXXXXXX-NOPE');
      consent.grant();
      analytics.sync();
      expect(analytics.configured).toBe(false);
      expect(analytics.isLoaded()).toBe(false);
      expect(scriptTags()).toHaveLength(0);
    });

    it('accepts a well-formed id', () => {
      expect(create(REAL_ID).analytics.configured).toBe(true);
    });
  });
});
