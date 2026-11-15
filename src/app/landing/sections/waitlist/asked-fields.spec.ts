import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { LeadKind } from '../../../api/Leads/ILead';
import { PageLang, PageLangService } from '../../../core/i18n/page-lang';
import { Waitlist } from './waitlist';
import { WAITLIST_COPY } from './waitlist-copy';
import { askedFieldLabels, askedFieldsPhrase } from './asked-fields';

const LANGS: readonly PageLang[] = ['en', 'es-MX'];
const SIDES: readonly LeadKind[] = ['company', 'candidate'];

// The audience pages name the form's fields in prose. These mount the FORM and
// read the labels it renders, then measure the phrase against them: a phrase
// built from a second copy of the list would pass a test that only read the
// declaration, which is how eight hand-written wordings of `role` survived 517
// tests.
describe('the phrase that names the fields a side is asked for', () => {
  let fixture: ComponentFixture<Waitlist>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Waitlist],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Waitlist);
    await fixture.whenStable();
  });

  function host(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  async function inLang(lang: PageLang): Promise<void> {
    TestBed.inject(PageLangService).set(lang);
    await fixture.whenStable();
  }

  async function pick(side: LeadKind): Promise<void> {
    const radio = host().querySelector<HTMLInputElement>(`input[type="radio"][value="${side}"]`);
    if (!radio) {
      throw new Error(`No radio for ${side} — the chooser moved.`);
    }
    radio.click();
    await fixture.whenStable();
  }

  // What the visitor reads above each input, marker and all.
  function renderedLabels(): string[] {
    return Array.from(host().querySelectorAll('.field__label')).map((label) =>
      (label.textContent ?? '').replace(/\s+/g, ' ').trim(),
    );
  }

  for (const lang of LANGS) {
    for (const side of SIDES) {
      it(`names every field the ${side} form renders in ${lang}, and no other`, async () => {
        await inLang(lang);
        await pick(side);

        expect(askedFieldLabels(lang, side)).toEqual(renderedLabels());
      });

      it(`puts every ${side} label into the ${lang} phrase`, async () => {
        await inLang(lang);
        await pick(side);

        const phrase = askedFieldsPhrase(lang, side);
        for (const label of renderedLabels()) {
          expect(phrase).toContain(label);
        }
      });
    }

    it(`joins the ${lang} phrase with that language's last conjunction`, () => {
      const joiner = lang === 'en' ? ' and ' : ' y ';
      expect(askedFieldsPhrase(lang, 'candidate')).toContain(joiner);
      expect(askedFieldsPhrase(lang, 'candidate').split(joiner)).toHaveLength(2);
    });

    it(`marks the optional field in ${lang} and leaves the required ones bare`, async () => {
      await inLang(lang);
      const marker = WAITLIST_COPY[lang].roleOptional;

      const candidate = askedFieldLabels(lang, 'candidate');
      expect(candidate.filter((label) => label.includes(marker))).toHaveLength(1);

      const company = askedFieldLabels(lang, 'company');
      expect(company.filter((label) => label.includes(marker))).toHaveLength(0);
    });

    it(`gives each side the field only it is asked for, in ${lang}`, () => {
      const candidate = askedFieldsPhrase(lang, 'candidate');
      const company = askedFieldsPhrase(lang, 'company');

      expect(candidate).toContain(WAITLIST_COPY[lang].labelRole);
      expect(candidate).not.toContain(WAITLIST_COPY[lang].labelCompany);

      expect(company).toContain(WAITLIST_COPY[lang].labelCompany);
      expect(company).not.toContain(WAITLIST_COPY[lang].labelRole);
    });
  }
});
