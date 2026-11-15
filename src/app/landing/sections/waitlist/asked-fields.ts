import { LeadKind } from '../../../api/Leads/ILead';
import { PageLang } from '../../../core/i18n/page-lang';
import { collectedFields } from './collected-fields';
import { WAITLIST_COPY } from './waitlist-copy';

// The word a language puts before the last item of a list. A page names the
// form's fields through here instead of writing them out, so prose can never
// promise a field the form does not ask for.
const LAST_JOINER: Readonly<Record<PageLang, string>> = {
  en: ' and ',
  'es-MX': ' y ',
} as const;

// The fields one side of the marketplace is actually shown, in the form's own
// labels, with the form's own marker on the ones that may be left blank.
export function askedFieldLabels(lang: PageLang, kind: LeadKind): readonly string[] {
  const optional = WAITLIST_COPY[lang].roleOptional;

  return collectedFields(lang)
    .filter((field) => field.askedOf === null || field.askedOf === kind)
    .map((field) => (field.required ? field.label : `${field.label} ${optional}`));
}

// The same list as one sentence fragment, for prose that ends by naming them.
export function askedFieldsPhrase(lang: PageLang, kind: LeadKind): string {
  const labels = askedFieldLabels(lang, kind);
  if (labels.length < 2) {
    return labels.join('');
  }

  const head = labels.slice(0, -1).join(', ');
  return `${head}${LAST_JOINER[lang]}${labels[labels.length - 1]}`;
}
