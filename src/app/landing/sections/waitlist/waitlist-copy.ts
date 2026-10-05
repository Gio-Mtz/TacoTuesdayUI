import { PageLang } from '../../../core/i18n/page-lang';

export interface WaitlistCopy {
  readonly eyebrow: string;
  readonly title: string;
  readonly lede: string;

  readonly sending: string;

  readonly variantLegend: string;
  readonly variantCompany: string;
  readonly variantCandidate: string;

  readonly labelName: string;
  readonly labelEmail: string;
  readonly labelCompany: string;
  readonly labelRole: string;
  readonly roleOptional: string;
  readonly rolePlaceholder: string;

  readonly honeypotLabel: string;

  readonly submit: string;
  readonly submitting: string;

  readonly legalBefore: string;
  readonly legalLink: string;
  readonly legalAfter: string;

  readonly successTitle: string;
  readonly successBodyBefore: string;
  readonly successBodyAfter: string;
  readonly alreadyTitle: string;
  readonly alreadyBody: string;
  readonly again: string;

  readonly errors: WaitlistErrorCopy;
  readonly failures: WaitlistFailureCopy;
}

export interface WaitlistErrorCopy {
  readonly nameRequired: string;
  readonly emailRequired: string;
  readonly emailInvalid: string;
  readonly companyRequired: string;

  readonly maxChars: (max: number) => string;
}

export interface WaitlistFailureCopy {
  readonly offline: string;
  readonly validation: string;
  readonly rateLimited: string;
  readonly generic: string;
}

export const WAITLIST_COPY: Readonly<Record<PageLang, WaitlistCopy>> = {
  en: {
    eyebrow: 'Waitlist',
    title: 'Leave us your email',
    lede:
      'We write to you when your side of the platform opens. No newsletter, no reminders: one ' +
      'email, when there is something to tell you.',

    sending: 'Sending your details…',

    variantLegend: 'Which side are you on?',
    variantCompany: "I'm hiring",
    variantCandidate: "I'm looking for work",

    labelName: 'Name',
    labelEmail: 'Email',
    labelCompany: 'Company',
    labelRole: 'Role or area',
    roleOptional: '(optional)',
    rolePlaceholder: 'Backend .NET, QA, data…',

    honeypotLabel: 'Do not fill this in',

    submit: 'Put me on the list',
    submitting: 'Sending…',

    legalBefore: 'By submitting you accept our',
    legalLink: 'privacy notice',
    legalAfter: '. You can ask us to delete your data whenever you want.',

    successTitle: 'Done, you are on the list',
    successBodyBefore: 'We write to',
    successBodyAfter: 'when we open. If it does not arrive, check your spam folder.',
    alreadyTitle: 'You were already on the list',
    alreadyBody:
      'That email was already registered, so we did not do anything twice. You are still on the ' +
      'list and we write to you when we open.',
    again: 'Sign someone else up',

    errors: {
      nameRequired: 'Write your name.',
      emailRequired: 'Write your email.',
      emailInvalid: 'That email does not look right. Check it has an @ and a domain.',
      companyRequired: 'Write your company name.',
      maxChars: (max) => `${max} characters maximum.`,
    },

    failures: {
      offline: 'We could not reach the server. Check your connection and try again.',
      validation: 'Some field did not pass the server validation. Check it and try again.',
      rateLimited: 'Too many attempts in a row. Wait a minute and try again.',
      generic: 'Something broke on our side. Try again in a moment.',
    },
  },

  'es-MX': {
    eyebrow: 'Lista de espera',
    title: 'Déjanos tu correo',
    lede:
      'Te escribimos cuando abra tu lado de la plataforma. Sin newsletter y sin recordatorios: un ' +
      'correo, cuando haya algo que contarte.',

    sending: 'Enviando tus datos…',

    variantLegend: '¿De qué lado vienes?',
    variantCompany: 'Estoy contratando',
    variantCandidate: 'Busco trabajo',

    labelName: 'Nombre',
    labelEmail: 'Correo',
    labelCompany: 'Empresa',
    labelRole: 'Puesto o área',
    roleOptional: '(opcional)',
    rolePlaceholder: 'Backend .NET, QA, datos…',

    honeypotLabel: 'No llenes esto',

    submit: 'Apúntame',
    submitting: 'Enviando…',

    legalBefore: 'Al enviar aceptas nuestro',
    legalLink: 'aviso de privacidad',
    legalAfter: '. Puedes pedirnos que borremos tus datos cuando quieras.',

    successTitle: 'Listo, ya estás en la lista',
    successBodyBefore: 'Te escribimos a',
    successBodyAfter: 'cuando abramos. Si no llega, revisa tu carpeta de spam.',
    alreadyTitle: 'Ya estabas en la lista',
    alreadyBody:
      'Ese correo ya estaba registrado, así que no hicimos nada dos veces. Sigues en la lista y te ' +
      'escribimos cuando abramos.',
    again: 'Apuntar a alguien más',

    errors: {
      nameRequired: 'Escribe tu nombre.',
      emailRequired: 'Escribe tu correo.',
      emailInvalid: 'Ese correo no se ve bien. Revisa que tenga una @ y un dominio.',
      companyRequired: 'Escribe el nombre de tu empresa.',
      maxChars: (max) => `Máximo ${max} caracteres.`,
    },

    failures: {
      offline: 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo otra vez.',
      validation: 'Algún campo no pasó la validación del servidor. Revísalo e inténtalo otra vez.',
      rateLimited: 'Demasiados intentos seguidos. Espera un minuto e inténtalo otra vez.',
      generic: 'Algo se rompió de nuestro lado. Inténtalo en un momento.',
    },
  },
} as const;
