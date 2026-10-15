import { PageLang } from '../i18n/page-lang';

export interface ThemeCopy {
  readonly manageTitle: string;
  readonly manageLight: string;
  readonly manageDark: string;
  readonly manageSystem: string;
  readonly manageUseSystem: string;
}

// Lives next to the theme service for the same reason CONSENT_COPY lives next
// to the consent service: it is the copy of one stored decision, and the page
// that manages it is not the only place that could.
export const THEME_COPY: Readonly<Record<PageLang, ThemeCopy>> = {
  en: {
    manageTitle: 'Your theme choice',
    manageLight: 'Right now you chose light mode, so this page ignores your system setting.',
    manageDark: 'Right now you chose dark mode, so this page ignores your system setting.',
    manageSystem: 'Right now this page follows your system setting.',
    manageUseSystem: 'Follow my system setting again',
  },
  'es-MX': {
    manageTitle: 'Tu decisión de tema',
    manageLight:
      'Ahora mismo elegiste el modo claro, así que esta página ignora la configuración de tu sistema.',
    manageDark:
      'Ahora mismo elegiste el modo oscuro, así que esta página ignora la configuración de tu sistema.',
    manageSystem: 'Ahora mismo esta página sigue la configuración de tu sistema.',
    manageUseSystem: 'Volver a seguir la configuración de mi sistema',
  },
} as const;
