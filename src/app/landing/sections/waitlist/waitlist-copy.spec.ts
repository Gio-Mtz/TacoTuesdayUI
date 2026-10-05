import { PageLang } from '../../../core/i18n/page-lang';
import { WAITLIST_COPY, WaitlistCopy } from './waitlist-copy';

/**
 * A trip wire on the record, not a test of behaviour.
 *
 * The form reads its words from one of two objects chosen at runtime by the
 * route's language, and TypeScript guarantees both objects have the same KEYS.
 * What it cannot guarantee is that both are filled in: a half-translated record
 * passes the compiler, passes every component test that runs in English, builds
 * clean, and ships a Spanish page with an empty button. US-009 hit exactly this
 * shape from the other side — tests that asserted the Spanish `aria-label` on a
 * page that had become English, and so defended the bug.
 *
 * So these assertions are about the DATA: nothing blank, nothing left in the
 * wrong language, and the two languages genuinely different from each other.
 */
describe('WAITLIST_COPY', () => {
  const languages: readonly PageLang[] = ['en', 'es-MX'];

  /** Every plain string in a copy record, flattened, with its path. */
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
        // A function, not a string, so an empty-string check cannot see it.
        expect(copy.errors.maxChars(80)).toContain('80');
        expect(copy.errors.maxChars(160)).toContain('160');
      });

      it('gives all four HTTP outcomes their own sentence', () => {
        const { offline, validation, rateLimited, generic } = copy.failures;
        expect(new Set([offline, validation, rateLimited, generic]).size).toBe(4);
      });

      it('does not say the same thing for a fresh signup and a repeat one', () => {
        // The whole point of `alreadyRegistered` is that the visitor is told
        // something different. Identical strings here would make the 200 branch
        // of US-004's contract invisible.
        expect(copy.successTitle).not.toBe(copy.alreadyTitle);
        expect(copy.successBodyAfter).not.toBe(copy.alreadyBody);
      });
    });
  }

  it('is actually translated, not copied', () => {
    // Catches the real mistake: duplicating the English block to start the
    // Spanish one and forgetting to translate half of it.
    const en = new Map(strings(WAITLIST_COPY.en));
    const shared = strings(WAITLIST_COPY['es-MX'])
      .filter(([path, value]) => en.get(path) === value)
      .map(([path]) => path);

    expect(shared).toEqual([]);
  });

  it('keeps the Spanish legal line pointing at a Spanish notice', () => {
    // `/privacidad` is a Mexican aviso de privacidad. The link text has to name
    // it as what it is, in both languages, because the notice IS that document.
    expect(WAITLIST_COPY['es-MX'].legalLink).toContain('aviso de privacidad');
    expect(WAITLIST_COPY.en.legalLink).toContain('privacy notice');
  });
});
