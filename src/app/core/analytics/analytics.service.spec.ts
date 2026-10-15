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

// Copied verbatim out of the gtag.js container and left UNALTERED: `Qb` decides
// whether a dataLayer entry is a command, `xE` whether to process it. The suite
// judges the service by Google's rule, not by our idea of the queue.
function isArgumentsObject(entry: unknown): boolean {
  return (
    !!entry &&
    (Object.prototype.toString.call(entry) === '[object Arguments]' ||
      Object.prototype.hasOwnProperty.call(entry, 'callee'))
  );
}

function gtagWouldProcess(entry: unknown): boolean {
  if (entry === null || typeof entry !== 'object') {
    return false;
  }
  if ((entry as { event?: unknown }).event) {
    return true;
  }
  if (isArgumentsObject(entry)) {
    const command = (entry as Record<number, unknown>)[0];
    return command === 'config' || command === 'event' || command === 'js' || command === 'get';
  }
  return false;
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

      const theDefault = dataLayer().find(
        (entry) => entry[0] === 'consent' && entry[1] === 'default',
      );
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

    // Every assertion above reads the queue by index, which an array satisfies just
    // as well as an `arguments` object -- so they all pass while gtag.js throws every
    // command away. This is the only one that checks the entry TYPE.
    it('queues each command as an arguments object — gtag.js drops anything else', () => {
      const { analytics, consent } = create(REAL_ID);
      consent.grant();
      analytics.sync();

      const queued = dataLayer();
      expect(queued.length).toBeGreaterThan(0);

      for (const entry of queued) {
        expect(Object.prototype.toString.call(entry)).toBe('[object Arguments]');
      }
    });

    it("is accepted by gtag.js's own predicate — the queue is useless otherwise", () => {
      const { analytics, consent } = create(REAL_ID);
      consent.grant();
      analytics.sync();

      const commands = dataLayer().map((entry) => String((entry as Record<number, unknown>)[0]));
      expect(commands).toEqual(['consent', 'js', 'config']);

      const processed = dataLayer().filter((entry) => gtagWouldProcess(entry));
      const names = processed.map((entry) => String((entry as Record<number, unknown>)[0]));

      // `consent` is not in xE's command list -- it is read later -- so the two that
      // must be accepted are `js` and `config`. A dropped `config` means the
      // Measurement ID is never configured and no hit is ever sent.
      expect(names).toContain('js');
      expect(names).toContain('config');
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

  describe('event()', () => {
    const PARAMS = { lead_kind: 'company', already_registered: false } as const;

    function sentEvents(): unknown[][] {
      return dataLayer().filter((entry) => (entry as Record<number, unknown>)[0] === 'event');
    }

    it('sends the event with its name and params, and says it sent it', () => {
      const { analytics, consent } = create(REAL_ID);
      consent.grant();
      analytics.sync();

      expect(analytics.event('generate_lead', PARAMS)).toBe(true);

      const events = sentEvents();
      expect(events).toHaveLength(1);
      expect(events[0][1]).toBe('generate_lead');
      expect(events[0][2]).toEqual(PARAMS);
    });

    it('queues it the way gtag.js demands — by its own predicate, not by ours', () => {
      const { analytics, consent } = create(REAL_ID);
      consent.grant();
      analytics.sync();
      analytics.event('generate_lead', PARAMS);

      const queued = sentEvents()[0];
      expect(isArgumentsObject(queued)).toBe(true);
      expect(gtagWouldProcess(queued)).toBe(true);
    });

    it('sends nothing before anyone has chosen — a hit is tracking, consent or not', () => {
      const { analytics } = create(REAL_ID);
      analytics.sync();

      expect(analytics.event('generate_lead', PARAMS)).toBe(false);
      expect(sentEvents()).toHaveLength(0);
    });

    it('sends nothing once consent is withdrawn, even though gtag is still on the page', () => {
      const { analytics, consent } = create(REAL_ID);
      consent.grant();
      analytics.sync();
      consent.deny();
      analytics.sync();

      expect(analytics.event('generate_lead', PARAMS)).toBe(false);
      expect(sentEvents()).toHaveLength(0);
    });

    it('sends nothing when the id is not a GA4 id — this is what dev runs with', () => {
      const { analytics, consent } = create('');
      consent.grant();
      analytics.sync();

      expect(analytics.event('generate_lead', PARAMS)).toBe(false);
      expect(sentEvents()).toHaveLength(0);
    });

    it('refuses instead of throwing when consent was granted but gtag never arrived', () => {
      const { analytics, consent } = create(REAL_ID);
      consent.grant();
      analytics.sync();
      delete (window as unknown as { gtag?: unknown }).gtag;

      expect(() => analytics.event('generate_lead', PARAMS)).not.toThrow();
      expect(analytics.event('generate_lead', PARAMS)).toBe(false);
    });

    it('defaults to no params rather than undefined', () => {
      const { analytics, consent } = create(REAL_ID);
      consent.grant();
      analytics.sync();
      analytics.event('generate_lead');

      expect(sentEvents()[0][2]).toEqual({});
    });
  });
});
