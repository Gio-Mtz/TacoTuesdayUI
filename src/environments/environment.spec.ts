import { environment as local } from './environment';
import { environment as production } from './environment.production';

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

    it('is not the Central US host that OPS-5 destroyed', () => {
      expect(production.apiBaseUrl).not.toContain('ambitiousmeadow');
      expect(production.apiBaseUrl).not.toContain('.centralus.');
    });
  });
});
