import { PageLang } from '../../../core/i18n/page-lang';
import { WAITLIST_COPY, WaitlistCopy } from './waitlist-copy';

describe('WAITLIST_COPY', () => {
  const languages: readonly PageLang[] = ['en', 'es-MX'];

  function strings(copy: WaitlistCopy): readonly [string, string][] {
    const out: [string, string][] = [];

    for (const [key, value] of Object.entries(copy)) {
      if (typeof value === 'string') {
        out.push([key, value]);
      } else if (value && typeof value === 'object') {
        for (const [inner, innerValue] of Object.entries(value as Record<string, unknown>)) {
          if (typeof innerValue === 'string') {
            out.push([`${key}.${inner}`, innerValue]);
          }
        }
      }
    }

    return out;
  }

  it('has copy for every language the site has pages in', () => {
    expect(Object.keys(WAITLIST_COPY).sort()).toEqual([...languages].sort());
  });

  for (const lang of languages) {
    describe(lang, () => {
      const copy = WAITLIST_COPY[lang];

      it('leaves nothing blank', () => {
        const blank = strings(copy)
          .filter(([, value]) => value.trim() === '')
          .map(([path]) => path);
        expect(blank).toEqual([]);
      });

      it('fills in both max-length messages with the number', () => {
        expect(copy.errors.maxChars(80)).toContain('80');
        expect(copy.errors.maxChars(160)).toContain('160');
      });

      it('gives all four HTTP outcomes their own sentence', () => {
        const { offline, validation, rateLimited, generic } = copy.failures;
        expect(new Set([offline, validation, rateLimited, generic]).size).toBe(4);
      });

      it('does not say the same thing for a fresh signup and a repeat one', () => {
        expect(copy.successTitle).not.toBe(copy.alreadyTitle);
        expect(copy.successBodyAfter).not.toBe(copy.alreadyBody);
      });
    });
  }

  it('is actually translated, not copied', () => {
    const en = new Map(strings(WAITLIST_COPY.en));
    const shared = strings(WAITLIST_COPY['es-MX'])
      .filter(([path, value]) => en.get(path) === value)
      .map(([path]) => path);

    expect(shared).toEqual([]);
  });

  it('keeps the Spanish legal line pointing at a Spanish notice', () => {
    expect(WAITLIST_COPY['es-MX'].legalLink).toContain('aviso de privacidad');
    expect(WAITLIST_COPY.en.legalLink).toContain('privacy notice');
  });
});
