import { PageLang } from '../../core/i18n/page-lang';

export interface TalentPoint {
  readonly icon: string;
  readonly title: string;
  readonly body: string;
}

export interface TalentCopy {
  // Every door on the page is built from this, so the English page can never
  // send a reader to the Spanish form by having a route hardcoded in markup.
  readonly route: string;

  readonly heroId: string;
  readonly stepsId: string;
  readonly waitlistId: string;

  readonly heroEyebrow: string;
  readonly heroTitleTop: string;
  readonly heroTitleBottom: string;
  readonly heroLede: string;
  readonly heroCta: string;
  readonly heroNote: string;

  readonly valueEyebrow: string;
  readonly valueTitle: string;
  readonly valueCta: string;
  readonly points: readonly TalentPoint[];

  readonly stepsEyebrow: string;
  readonly stepsTitle: string;
  readonly stepsCta: string;
  readonly steps: readonly TalentPoint[];
}

export const TALENT_COPY: Readonly<Record<PageLang, TalentCopy>> = {
  en: {
    route: '/engineers',

    heroId: 'engineers',
    stepsId: 'how-it-works',
    waitlistId: 'waitlist',

    heroEyebrow: 'For engineers',
    heroTitleTop: 'Tired of recruiters ghosting you?',
    heroTitleBottom: 'Let them come to you',
    heroLede:
      'You are not sending a CV into a mailbox nobody opens. You leave your profile once and the companies that are actually hiring come to you — with a date, and with a process that ends in an answer.',
    heroCta: 'Put me on the list',
    heroNote: 'The waiting list is open. For engineers it is always free.',

    valueEyebrow: 'What changes for you',
    valueTitle: 'Three things, and all three show',
    valueCta: 'I want them to find me',
    points: [
      {
        icon: 'eye',
        title: 'You are measured by what you can build',
        body: 'Your stack and what you have already shipped come first. No filters asking for 5 years in something that came out 3 years ago.',
      },
      {
        icon: 'bell',
        title: 'You are never left without an answer',
        body: 'You know which step you are on and when the next one is. If it is a no, it is a no — not three weeks of silence.',
      },
      {
        icon: 'chat',
        title: 'Feedback you can actually use',
        body: 'What they expected, what they saw and what was missing. In writing, so the next interview goes better.',
      },
    ],

    stepsEyebrow: 'How it works',
    stepsTitle: 'Three steps, no fine print',
    stepsCta: 'Leave my email',
    steps: [
      {
        icon: 'mail',
        title: 'Leave us your email',
        body: 'Just your name, your email and what you are working on. It takes under a minute and we do not ask for a CV yet.',
      },
      {
        icon: 'search',
        title: 'We go looking for you',
        body: 'We compare what the company needs against what you actually do. If it does not fit, we do not waste your time.',
      },
      {
        icon: 'thumbs-up',
        title: 'An interview with a date and an answer',
        body: 'A date agreed up front, the interview, and written feedback at the end. Whether it works out or not.',
      },
    ],
  },

  'es-MX': {
    route: '/talento',

    heroId: 'para-devs',
    stepsId: 'como-funciona',
    waitlistId: 'lista-de-espera',

    heroEyebrow: 'Para devs',
    heroTitleTop: '¿Odias que los reclutas te ghosteen?',
    heroTitleBottom: 'Deja que ellos te busquen',
    heroLede:
      'No estás mandando tu CV a un buzón que nadie abre. Dejas tu perfil una vez y las empresas que de verdad están contratando llegan a ti — con fecha, y con un proceso que termina en una respuesta.',
    heroCta: 'Apúntame a la lista',
    heroNote: 'Lista de espera abierta. Para devs siempre es gratis.',

    valueEyebrow: 'Qué cambia para ti',
    valueTitle: 'Tres cosas, y las tres se notan',
    valueCta: 'Quiero que me busquen',
    points: [
      {
        icon: 'eye',
        title: 'Te miden por lo que sabes construir',
        body: 'Tu stack y lo que ya entregaste van primero. Sin filtros que piden 5 años en algo que salió hace 3.',
      },
      {
        icon: 'bell',
        title: 'Nunca te quedas sin respuesta',
        body: 'Sabes en qué paso vas y cuándo es el siguiente. Si es un no, es un no — no tres semanas de silencio.',
      },
      {
        icon: 'chat',
        title: 'Feedback que sí te sirve',
        body: 'Qué esperaban, qué vieron y qué faltó. Por escrito, para que la siguiente entrevista te salga mejor.',
      },
    ],

    stepsEyebrow: 'Cómo funciona',
    stepsTitle: 'Tres pasos, sin letras chiquitas',
    stepsCta: 'Dejar mi correo',
    steps: [
      {
        icon: 'mail',
        title: 'Déjanos tu correo',
        body: 'Nada más tu nombre, tu correo y en qué andas. Te toma menos de un minuto y no te pedimos CV todavía.',
      },
      {
        icon: 'search',
        title: 'Te buscamos nosotros',
        body: 'Cruzamos lo que la empresa necesita contra lo que tú sí haces. Si no cuadra, no te hacemos perder el tiempo.',
      },
      {
        icon: 'thumbs-up',
        title: 'Entrevista con fecha y respuesta',
        body: 'Fecha acordada desde el principio, entrevista, y feedback por escrito al final. Salga o no salga.',
      },
    ],
  },
} as const;
