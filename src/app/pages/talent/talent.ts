import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Waitlist } from '../../landing/sections/waitlist/waitlist';
import { Icon } from '../../shared/icon/icon';

export interface TalentValuePoint {
  readonly icon: string;
  readonly title: string;
  readonly body: string;
}

export interface TalentStep {
  readonly icon: string;
  readonly title: string;
  readonly body: string;
}

@Component({
  selector: 'ttco-talent',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, Waitlist],
  templateUrl: './talent.html',
  styleUrl: './talent.scss',
})
export class Talent {
  protected readonly points: readonly TalentValuePoint[] = [
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
  ];

  protected readonly steps: readonly TalentStep[] = [
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
  ];
}
