import { CONSENT_COPY } from './consent-copy';
import { PageLang } from '../i18n/page-lang';

const LANGS: readonly PageLang[] = ['en', 'es-MX'];

describe('CONSENT_COPY', () => {
  it('covers both page languages', () => {
    expect(Object.keys(CONSENT_COPY).sort()).toEqual(['en', 'es-MX']);
  });

  for (const lang of LANGS) {
    describe(lang, () => {
      const copy = CONSENT_COPY[lang];

      it('fills every slot with something', () => {
        for (const [key, value] of Object.entries(copy)) {
          expect(value.trim().length, key).toBeGreaterThan(0);
        }
      });

      it('names the provider, so the choice is informed', () => {
        expect(copy.body).toContain('Google Analytics');
      });

      it('gives reject a label as plain as accept — a nudge is not consent', () => {
        expect(copy.reject.length).toBeLessThanOrEqual(copy.accept.length + 4);
      });

      it('says nothing loads before the choice', () => {
        expect(copy.manageUnset.length).toBeGreaterThan(0);
        expect(copy.manageDenied).not.toBe(copy.manageGranted);
      });
    });
  }
});
