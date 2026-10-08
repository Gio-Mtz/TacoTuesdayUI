import { PageLang } from '../i18n/page-lang';

export interface ConsentCopy {
  readonly title: string;
  readonly body: string;
  readonly accept: string;
  readonly reject: string;
  readonly privacyLink: string;
  readonly manageTitle: string;
  readonly manageGranted: string;
  readonly manageDenied: string;
  readonly manageUnset: string;
  readonly manageChange: string;
}

export const CONSENT_COPY: Readonly<Record<PageLang, ConsentCopy>> = {
  en: {
    title: 'Can we measure how this page is doing?',
    body: 'We would use Google Analytics to count visits and see which parts of the page work. It stores cookies in your browser. Nothing loads until you choose, and you can change your mind whenever you want.',
    accept: 'Accept',
    reject: 'Reject',
    privacyLink: 'Read the privacy notice',
    manageTitle: 'Your cookie choice',
    manageGranted: 'Right now you accept analytics cookies.',
    manageDenied: 'Right now you reject analytics cookies, and nothing is loaded.',
    manageUnset: 'You have not chosen yet, so nothing is loaded.',
    manageChange: 'Change my choice',
  },
  'es-MX': {
    title: '¿Podemos medir cómo le va a esta página?',
    body: 'Usaríamos Google Analytics para contar visitas y ver qué partes de la página funcionan. Eso guarda cookies en tu navegador. No se carga nada hasta que elijas, y puedes cambiar de opinión cuando quieras.',
    accept: 'Aceptar',
    reject: 'Rechazar',
    privacyLink: 'Leer el aviso de privacidad',
    manageTitle: 'Tu decisión sobre cookies',
    manageGranted: 'Ahora mismo aceptas las cookies de analítica.',
    manageDenied: 'Ahora mismo rechazas las cookies de analítica, y no se carga nada.',
    manageUnset: 'Todavía no eliges, así que no se carga nada.',
    manageChange: 'Cambiar mi decisión',
  },
} as const;
