import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Icon } from '../../../shared/icon/icon';

/** One promise to the candidate, in the terms they already complain in. */
export interface CandidateValuePoint {
  readonly icon: string;
  readonly title: string;
  readonly body: string;
}

/**
 * The Candidatos section.
 *
 * The heading is the stakeholder's line, kept word for word from the backlog:
 * "¿Odias que los reclutas te ghosteen? Deja que ellos te busquen". It is the
 * one piece of copy on this page that was not up for editing — it is the whole
 * pitch to this audience in a sentence they have already said out loud.
 */
@Component({
  selector: 'ttco-candidates',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './candidates.html',
  styleUrl: './candidates.scss',
})
export class Candidates {
  protected readonly points: readonly CandidateValuePoint[] = [
    {
      icon: 'eye',
      title: 'Te ven por lo que sabes hacer',
      body: 'Tu stack y lo que has construido van al frente. Sin filtros de "5 años en una tecnología que tiene 3".',
    },
    {
      icon: 'bell',
      title: 'Nunca te quedas sin respuesta',
      body: 'Sabes en qué paso vas y cuándo sigue el siguiente. Si es un no, te llega un no — no un silencio de tres semanas.',
    },
    {
      icon: 'chat',
      title: 'Feedback que sí sirve',
      body: 'Qué esperaban, qué vieron y qué faltó. Escrito, para que la siguiente entrevista te salga mejor.',
    },
  ];
}
