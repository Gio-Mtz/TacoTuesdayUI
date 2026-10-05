import { environment as local } from './environment';
import { environment as production } from './environment.production';

/**
 * These are not tests of behaviour, they are a tripwire on two values that no
 * other test can see.
 *
 * The production environment file is only ever loaded by a production build, and
 * a production build is not something the test suite runs. So the way the
 * `apiBaseUrl` typo is normally found is a visitor filling in the waitlist form
 * and being told "no pudimos conectar". This file moves that discovery to CI at
 * the cost of five assertions.
 *
 * What it cannot check is the wiring — whether `angular.json` actually performs
 * the replacement. That has no test; it has evidence: the block that changes it
 * greps the emitted bundle for the FQDN and pastes the hit in the work log.
 */
describe('environments', () => {
  describe('local (also what ng test and ng serve get)', () => {
    it('has an empty apiBaseUrl so URLs stay relative for proxy.conf.json', () => {
      expect(local.apiBaseUrl).toBe('');
    });

    it('is not flagged as production', () => {
      expect(local.production).toBe(false);
    });

    it('points canonical at the dev server, not at the live site', () => {
      // A local page claiming the production URL as canonical is how a draft
      // tells a crawler "the real one is over there" while you are looking at it.
      expect(local.siteBaseUrl).toContain('localhost');
    });
  });

  describe('production', () => {
    it('is flagged as production', () => {
      expect(production.production).toBe(true);
    });

    it('points at an absolute https origin', () => {
      // http:// would be downgraded/blocked from an https page, and a relative
      // value here is the exact bug this file exists to catch: it would make the
      // landing call its own Static Web App origin and get index.html back with
      // a 200, which reads as "the API returned garbage" rather than "nobody set
      // the URL".
      expect(production.apiBaseUrl).toMatch(/^https:\/\/[^/]+$/);
    });

    it('has no trailing slash, so the interceptor cannot produce //api', () => {
      expect(production.apiBaseUrl.endsWith('/')).toBe(false);
    });

    it('has an absolute https siteBaseUrl with no trailing slash', () => {
      // `og:url`, `og:image` and `canonical` are built by concatenation. A
      // trailing slash makes `https://host//talento`, and a relative value
      // makes a card every crawler silently discards.
      expect(production.siteBaseUrl).toMatch(/^https:\/\/[^/]+$/);
    });

    it('is not the Central US host that OPS-5 destroyed', () => {
      // The environment was recreated in South Central US to sit next to the SQL
      // server; the old FQDN does not resolve any more. This assertion is the
      // cheapest possible guard against a copy-paste from an old note or an old
      // branch bringing it back.
      expect(production.apiBaseUrl).not.toContain('ambitiousmeadow');
      expect(production.apiBaseUrl).not.toContain('.centralus.');
    });
  });
});
