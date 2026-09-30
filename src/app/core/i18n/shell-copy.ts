import { PageLang } from './page-lang';

/**
 * The app shell's words: skip link, header nav, footer.
 *
 * **Why this file is not the i18n library US-009 said we do not need.** The
 * pages are different texts per audience and stay that way. The shell is the one
 * thing on the site that genuinely is the same sentence in two languages — a
 * footer cannot have a different meaning per audience — so it is the one thing
 * that needs a translation, and a translation of ten strings is a typed record,
 * not a dependency.
 *
 * It has two real consumers today, not one: `/` in English and `/privacidad`,
 * which is a Mexican aviso de privacidad and stays in Spanish. Without this the
 * privacy notice would ship with an English header and footer around Spanish
 * legal text.
 *
 * ⚠️ `navCompanies` / `navEngineers` / `navHowItWorks` point at sections of `/`,
 * which is the ENGLISH page. So the Spanish shell currently offers Spanish
 * labels for English destinations. That is a wrinkle US-010 closes, when
 * `/talento` gives the Spanish shell somewhere Spanish to point.
 */
export interface ShellCopy {
  readonly skipToContent: string;
  readonly navLabel: string;
  readonly navCompanies: string;
  readonly navEngineers: string;
  readonly navHowItWorks: string;
  readonly footerTagline: string;
  readonly footerNavLabel: string;
  readonly footerContact: string;
  readonly footerPrivacy: string;
  readonly footerMadeIn: string;
  /** What pressing the theme button WILL do. Never the current state — TD-004. */
  readonly themeToDark: string;
  readonly themeToLight: string;
}

export const SHELL_COPY: Readonly<Record<PageLang, ShellCopy>> = {
  en: {
    skipToContent: 'Skip to content',
    navLabel: 'Sections',
    navCompanies: 'Companies',
    navEngineers: 'Engineers',
    navHowItWorks: 'How it works',
    footerTagline: 'Interviews with a date, feedback in writing, and nobody left on read.',
    footerNavLabel: 'Contact and notices',
    footerContact: 'Contact',
    footerPrivacy: 'Privacy notice',
    footerMadeIn: 'Made in Guadalajara, Mexico.',
    themeToDark: 'Switch to dark mode',
    themeToLight: 'Switch to light mode',
  },
  'es-MX': {
    skipToContent: 'Saltar al contenido',
    navLabel: 'Secciones',
    navCompanies: 'Empresas',
    navEngineers: 'Candidatos',
    navHowItWorks: 'Cómo funciona',
    footerTagline: 'Entrevistas con fecha, con feedback y sin silencios.',
    footerNavLabel: 'Contacto y avisos',
    footerContact: 'Contacto',
    footerPrivacy: 'Aviso de privacidad',
    footerMadeIn: 'Hecho en Guadalajara, México.',
    themeToDark: 'Cambiar a modo oscuro',
    themeToLight: 'Cambiar a modo claro',
  },
} as const;
