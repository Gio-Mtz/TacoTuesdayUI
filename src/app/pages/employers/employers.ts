import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Waitlist } from '../../landing/sections/waitlist/waitlist';
import { Icon } from '../../shared/icon/icon';

export interface EmployerValuePoint {
  readonly icon: string;
  readonly title: string;
  readonly body: string;
}

export interface EmployerStep {
  readonly icon: string;
  readonly title: string;
  readonly body: string;
}

@Component({
  selector: 'ttco-employers',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, Waitlist],
  templateUrl: './employers.html',
  styleUrl: './employers.scss',
})
export class Employers {
  protected readonly points: readonly EmployerValuePoint[] = [
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
  ];

  protected readonly steps: readonly EmployerStep[] = [
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
  ];
}
