import { environment as local } from './environment';
import { environment as production } from './environment.production';
import { isValidMeasurementId } from '../app/core/analytics/consent';

describe('environments', () => {
  describe('local (also what ng test and ng serve get)', () => {
    it('has an empty apiBaseUrl so URLs stay relative for proxy.conf.json', () => {
      expect(local.apiBaseUrl).toBe('');
    });

    it('is not flagged as production', () => {
      expect(local.production).toBe(false);
    });

    it('points canonical at the dev server, not at the live site', () => {
      expect(local.siteBaseUrl).toContain('localhost');
    });

    it('has no analytics id, so ng serve and ng test never talk to Google', () => {
      expect(local.analyticsMeasurementId).toBe('');
    });
  });

  describe('production', () => {
    it('is flagged as production', () => {
      expect(production.production).toBe(true);
    });

    it('points at an absolute https origin', () => {
      expect(production.apiBaseUrl).toMatch(/^https:\/\/[^/]+$/);
    });

    it('has no trailing slash, so the interceptor cannot produce //api', () => {
      expect(production.apiBaseUrl.endsWith('/')).toBe(false);
    });

    it('has an absolute https siteBaseUrl with no trailing slash', () => {
      expect(production.siteBaseUrl).toMatch(/^https:\/\/[^/]+$/);
    });

    it('points canonical at the custom apex domain, not at the Static Web Apps default host', () => {
      // TD-018. Every absolute URL the build emits - og:url, canonical, the
      // hreflang alternates, sitemap.xml and robots.txt - is this string plus a
      // path, because emit-route-cards.mjs reads it from social-cards.json. If it
      // ever points back at the generated *.azurestaticapps.net host, the live
      // site advertises a canonical nobody is meant to link to, and it does it
      // silently: the shape guard above passes either way.
      expect(production.siteBaseUrl).toBe('https://tacotuesdayco.com');
      expect(production.siteBaseUrl).not.toContain('azurestaticapps.net');
    });

    it('is not the Central US host that OPS-5 destroyed', () => {
      expect(production.apiBaseUrl).not.toContain('ambitiousmeadow');
      expect(production.apiBaseUrl).not.toContain('.centralus.');
    });

    it('carries a real GA4 measurement id, so the banner renders and analytics can load', () => {
      // Reuses the app's own validator instead of a second copy of the pattern,
      // so this guard cannot drift away from what AnalyticsService accepts.
      expect(isValidMeasurementId(production.analyticsMeasurementId)).toBe(true);
    });
  });
});
