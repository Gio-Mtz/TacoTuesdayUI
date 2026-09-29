import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Icon } from '../../../shared/icon/icon';

/** A numbered step. The number comes from the position, never from the data. */
export interface HowItWorksStep {
  readonly icon: string;
  readonly title: string;
  readonly body: string;
}

/**
 * Cómo funciona, in three steps.
 *
 * Three because the point is to make the process feel short. Every extra step
 * on this list is one more reason for a visitor to decide it is a whole thing
 * and close the tab.
 *
 * The step number is rendered from the loop index rather than typed into the
 * copy, so reordering the array can never leave a "3." above the second card.
 */
@Component({
  selector: 'ttco-how-it-works',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './how-it-works.html',
  styleUrl: './how-it-works.scss',
})
export class HowItWorks {
  protected readonly steps: readonly HowItWorksStep[] = [
    {
      icon: 'mail',
      title: 'Dejas tu correo',
      body: 'Nos dices si vienes como empresa o como candidato. Toma menos de un minuto y no pedimos nada más todavía.',
    },
    {
      icon: 'search',
      title: 'Te emparejamos',
      body: 'Cruzamos lo que la empresa necesita con lo que la persona sabe hacer. Si no hay match, no te hacemos perder el tiempo.',
    },
    {
      icon: 'thumbs-up',
      title: 'Entrevista y respuesta',
      body: 'Una fecha acordada, una entrevista y feedback escrito al final. Para las dos partes.',
    },
  ];
}
