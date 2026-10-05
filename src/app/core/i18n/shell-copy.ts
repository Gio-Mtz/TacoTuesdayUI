import { PageLang } from './page-lang';

export interface ShellNavLink {
  readonly label: string;

  readonly path: string;

  readonly fragment?: string;

  readonly hreflang?: PageLang;
}

export interface ShellCopy {
  readonly skipToContent: string;
  readonly navLabel: string;

  readonly nav: readonly ShellNavLink[];

  readonly crossLanguage: ShellNavLink;

  readonly footerTagline: string;
  readonly footerNavLabel: string;
  readonly footerContact: string;
  readonly footerPrivacy: string;
  readonly footerMadeIn: string;

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
