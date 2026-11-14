import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { LeadKind } from '../../../api/Leads/ILead';
import { PageLang, PageLangService } from '../../../core/i18n/page-lang';
import { WAITLIST_COPY } from './waitlist-copy';
import { Waitlist } from './waitlist';
import { collectedFields } from './collected-fields';

const LANGS: readonly PageLang[] = ['en', 'es-MX'];

// The declaration exists so the privacy notice can name the fields the form
// asks for. These measure it against the form the visitor actually sees, not
// against another copy of the same list: a field added to the template without a
// line in `collected-fields.ts` fails here, which is the drift that put three
// invented fields in the notice.
describe('the fields the waitlist collects', () => {
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

  // The field's visible name with the optional marker taken off, because the
  // marker is measured on its own below.
  function labels(): string[] {
    return Array.from(host().querySelectorAll('.field__label')).map((label) => {
      const marker = label.querySelector('.field__optional')?.textContent ?? '';
      return (label.textContent ?? '').replace(marker, '').replace(/\s+/g, ' ').trim();
    });
  }

  function markedOptional(): string[] {
    return Array.from(host().querySelectorAll('.field__label'))
      .filter((label) => label.querySelector('.field__optional'))
      .map((label) => {
        const marker = label.querySelector('.field__optional')?.textContent ?? '';
        return (label.textContent ?? '').replace(marker, '').replace(/\s+/g, ' ').trim();
      });
  }

  function declared(lang: PageLang, side: LeadKind): string[] {
    return collectedFields(lang)
      .filter((field) => field.askedOf === null || field.askedOf === side)
      .map((field) => field.label);
  }

  LANGS.forEach((lang) => {
    describe(`in ${lang}`, () => {
      beforeEach(async () => {
        await inLang(lang);
      });

      it('declares exactly the fields the hiring side is shown', async () => {
        await pick('company');
        expect(labels().sort()).toEqual(declared(lang, 'company').sort());
      });

      it('declares exactly the fields the other side is shown', async () => {
        await pick('candidate');
        expect(labels().sort()).toEqual(declared(lang, 'candidate').sort());
      });

      it('marks optional the same field the form lets you leave blank', async () => {
        const optionalInForm = new Set<string>();
        for (const side of ['company', 'candidate'] as const) {
          await pick(side);
          markedOptional().forEach((label) => optionalInForm.add(label));
        }

        const optionalInDeclaration = collectedFields(lang)
          .filter((field) => !field.required)
          .map((field) => field.label);

        expect([...optionalInForm].sort()).toEqual(optionalInDeclaration.sort());
      });

      it('leaves the honeypot out, because it never reaches the API', () => {
        const names = collectedFields(lang).map((field) => field.label);
        expect(names).not.toContain(WAITLIST_COPY[lang].honeypotLabel);
      });
    });
  });

  it('names each field in the language the page is in', async () => {
    await inLang('en');
    const english = collectedFields('en').map((field) => field.label);
    await inLang('es-MX');
    const spanish = collectedFields('es-MX').map((field) => field.label);

    expect(spanish).not.toEqual(english);
    expect(spanish.length).toBe(english.length);
  });
});
