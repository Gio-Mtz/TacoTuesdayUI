import { PageLang } from '../../core/i18n/page-lang';

export interface EmployersPoint {
  readonly icon: string;
  readonly title: string;
  readonly body: string;
}

export interface EmployersCopy {
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
  readonly points: readonly EmployersPoint[];

  readonly stepsEyebrow: string;
  readonly stepsTitle: string;
  readonly stepsCta: string;
  readonly steps: readonly EmployersPoint[];

  readonly crossoverTitle: string;
  readonly crossoverBody: string;
  readonly crossoverCta: string;
  readonly crossoverRoute: string;

  // The engineers' side is a whole page in Spanish and a section of the landing
  // in English, so the exit needs an anchor in one language and not the other.
  readonly crossoverFragment?: string;
}

export const EMPLOYERS_COPY: Readonly<Record<PageLang, EmployersCopy>> = {
  en: {
    route: '/companies',

    heroId: 'for-companies',
    stepsId: 'how-it-works',
    waitlistId: 'waitlist',

    heroEyebrow: 'For companies',
    heroTitleTop: 'Stop burning weeks on interviews',
    heroTitleBottom: 'that filter nothing',
    heroLede:
      'Hiring an engineer goes into juggling calendars, reading CVs that say nothing and defending decisions from memory. That is the part we take off you.',
    heroCta: 'I want to hire',
    heroNote: 'The waiting list is open. We write to you when the company side opens.',

    valueEyebrow: 'What changes for your team',
    valueTitle: 'Three things, and all three show',
    valueCta: 'I want to see candidates',
    points: [
      {
        icon: 'calendar',
        title: 'No more juggling calendars',
        body: 'The candidate books against your real availability. Not one more email asking whether Thursday works.',
      },
      {
        icon: 'filter',
        title: 'Signal, not a pretty CV',
        body: 'Every profile arrives with what the person has already shipped and the stack they shipped it in, not three pages of adjectives.',
      },
      {
        icon: 'check-circle',
        title: 'Every interview leaves a record',
        body: 'Written feedback you can compare across candidates. When somebody asks why that one and not this one, it is already written down.',
      },
    ],

    stepsEyebrow: 'How it works',
    stepsTitle: 'Three steps, no fine print',
    stepsCta: 'Leave my email',
    steps: [
      {
        icon: 'mail',
        title: 'Leave us your email',
        body: 'Your name, your email and your company name. It takes under a minute and we ask for nothing else yet.',
      },
      {
        icon: 'search',
        title: 'We do the matching',
        body: 'We compare what you need against what the person actually does. If it does not fit, we do not send you the interview.',
      },
      {
        icon: 'thumbs-up',
        title: 'An interview with a date and an answer',
        body: 'A date agreed up front, the interview, and written feedback at the end. On both sides.',
      },
    ],

    crossoverTitle: 'Here looking for work?',
    crossoverBody:
      'This page is for the side that hires, and its form asks for a company name. Yours is the engineers’ side: there we ask what you build and we never ask for a company.',
    crossoverCta: 'Go to the engineers’ side',
    crossoverRoute: '/engineers',
  },

  'es-MX': {
    route: '/empresas',

    heroId: 'para-empresas',
    stepsId: 'como-funciona',
    waitlistId: 'lista-de-espera',

    heroEyebrow: 'Para empresas',
    heroTitleTop: 'Deja de quemar semanas en entrevistas',
    heroTitleBottom: 'que no filtran nada',
    heroLede:
      'Contratar un dev se te va en cuadrar calendarios, leer CVs que no dicen nada y justificar decisiones de memoria. Esa parte te la quitamos.',
    heroCta: 'Quiero contratar',
    heroNote: 'Lista de espera abierta. Te escribimos cuando abra el lado de empresas.',

    valueEyebrow: 'Qué cambia para tu equipo',
    valueTitle: 'Tres cosas, y las tres se notan',
    valueCta: 'Quiero ver candidatos',
    points: [
      {
        icon: 'calendar',
        title: 'Ya no andas cuadrando calendarios',
        body: 'El candidato agenda sobre tu disponibilidad real. Ni un correo más preguntando si el jueves se puede.',
      },
      {
        icon: 'filter',
        title: 'Señal, no un CV bonito',
        body: 'Cada perfil llega con lo que la persona ya entregó y en qué stack lo entregó, no con tres hojas de adjetivos.',
      },
      {
        icon: 'check-circle',
        title: 'Cada entrevista deja constancia',
        body: 'Feedback por escrito que puedes comparar entre candidatos. Cuando alguien pregunte por qué ese sí y ese no, ya está escrito.',
      },
    ],

    stepsEyebrow: 'Cómo funciona',
    stepsTitle: 'Tres pasos, sin letras chiquitas',
    stepsCta: 'Dejar mi correo',
    steps: [
      {
        icon: 'mail',
        title: 'Déjanos tu correo',
        body: 'Tu nombre, tu correo y el nombre de tu empresa. Te toma menos de un minuto y no te pedimos nada más todavía.',
      },
      {
        icon: 'search',
        title: 'Nosotros cruzamos',
        body: 'Comparamos lo que necesitas contra lo que la persona sí hace. Si no cuadra, no te mandamos la entrevista.',
      },
      {
        icon: 'thumbs-up',
        title: 'Entrevista con fecha y respuesta',
        body: 'Fecha acordada desde el principio, entrevista, y feedback por escrito al final. De los dos lados.',
      },
    ],

    crossoverTitle: '¿Llegaste buscando chamba?',
    crossoverBody:
      'Esta página es para quien contrata, y su formulario pide el nombre de la empresa. La tuya es la de devs: ahí te pedimos tu puesto y no te pedimos empresa.',
    crossoverCta: 'Ir a Para devs',
    crossoverRoute: '/talento',
  },
} as const;
