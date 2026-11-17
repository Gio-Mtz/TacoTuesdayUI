import { PageLang } from '../../core/i18n/page-lang';

export interface HealthCopy {
  readonly eyebrow: string;

  readonly title: string;

  readonly waiting: string;

  readonly moduleLabel: string;

  readonly serverTimeLabel: string;
}

// The page names ITSELF here. `SITE_INFO.legalName` is the footer's to print,
// and the footer prints it on this route like on the other eight, so a heading
// that repeated it left the page without a name of its own.
export const HEALTH_COPY: Readonly<Record<PageLang, HealthCopy>> = {
  en: {
    eyebrow: 'Status',
    title: 'API status',
    waiting: 'Talking to the API\u2026',
    moduleLabel: 'Module',
    serverTimeLabel: 'Server time (UTC)',
  },
  'es-MX': {
    eyebrow: 'Estado',
    title: 'Estado de la API',
    waiting: 'Hablando con la API\u2026',
    moduleLabel: 'M\u00f3dulo',
    serverTimeLabel: 'Hora del servidor (UTC)',
  },
} as const;
