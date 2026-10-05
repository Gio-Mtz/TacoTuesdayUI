import { PageLang } from './page-lang';

/**
 * One destination in the shell's navigation.
 *
 * It carries a path and not just a label because **the nav is not the same three
 * links in two languages** — that was the wrinkle US-009 wrote down and US-010
 * closes. Before this, the Spanish shell offered `Empresas` / `Candidatos` /
 * `Cómo funciona` and all three went to sections of `/`, which is the ENGLISH
 * page: a visitor on `/privacidad` clicked a Spanish word and landed in English.
 * A label is translatable; a destination is a different page.
 */
export interface ShellNavLink {
  readonly label: string;

  /** `routerLink` target. Always a full path, never a bare `#hash`. */
  readonly path: string;

  /** Section to scroll to once the page is there. Omitted for a whole page. */
  readonly fragment?: string;

  /**
   * Set only when the target is in a DIFFERENT language from the shell showing
   * the link, which is what makes it worth announcing. A Spanish link on a
   * Spanish page carries nothing — `hreflang` that merely repeats the current
   * language is noise a screen reader still reads.
   */
  readonly hreflang?: PageLang;
}

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
 * It has three real consumers since US-010: `/` in English, `/talento` in
 * Spanish, and `/privacidad`, which is a Mexican aviso de privacidad and stays
 * in Spanish. Without this the privacy notice would ship with an English header
 * and footer around Spanish legal text.
 */
export interface ShellCopy {
  readonly skipToContent: string;
  readonly navLabel: string;

  /**
   * Header nav, in order. **Every destination is in this record's own language**
   * — that is the rule that replaced three hardcoded anchors, and the reason
   * `es-MX` points at `/talento` instead of at the English landing.
   */
  readonly nav: readonly ShellNavLink[];

  /**
   * The one link that deliberately leaves the language: the other audience's
   * page. It lives in the footer rather than the nav because it is not a section
   * of what you are reading, it is the door to the other half of the business —
   * and a visitor who wants it is looking for it, not scanning for it.
   */
  readonly crossLanguage: ShellNavLink;

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
    nav: [
      { label: 'Companies', path: '/', fragment: 'companies' },
      { label: 'Engineers', path: '/', fragment: 'engineers' },
      { label: 'How it works', path: '/', fragment: 'how-it-works' },
    ],
    // Labelled in its own language on purpose. "For engineers (in Spanish)"
    // spends three words explaining a link whose own words already say it, and
    // `hreflang` tells the machines what the parenthesis was for.
    crossLanguage: { label: 'Para devs', path: '/talento', hreflang: 'es-MX' },
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
    // Spanish labels for Spanish destinations. Before US-010 there was nowhere
    // Spanish to send them and all three went to the English landing.
    nav: [
      { label: 'Para devs', path: '/talento', fragment: 'para-devs' },
      { label: 'Cómo funciona', path: '/talento', fragment: 'como-funciona' },
      { label: 'Lista de espera', path: '/talento', fragment: 'lista-de-espera' },
    ],
    crossLanguage: { label: 'For companies', path: '/', hreflang: 'en' },
    footerTagline: 'Entrevistas con fecha, con feedback y sin silencios.',
    footerNavLabel: 'Contacto y avisos',
    footerContact: 'Contacto',
    footerPrivacy: 'Aviso de privacidad',
    footerMadeIn: 'Hecho en Guadalajara, México.',
    themeToDark: 'Cambiar a modo oscuro',
    themeToLight: 'Cambiar a modo claro',
  },
} as const;
