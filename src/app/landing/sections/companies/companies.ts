import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Icon } from '../../../shared/icon/icon';

/** One pain, named the way a hiring manager would name it, and the answer. */
export interface CompanyValuePoint {
  readonly icon: string;
  readonly title: string;
  readonly body: string;
}

/**
 * The Empresas section: the problem this solves for the side that pays.
 *
 * Written as pain first, feature second, on purpose. "Agenda integrada" means
 * nothing to someone who has not yet admitted that scheduling is eating their
 * week; "dejas de perseguir horarios por correo" does.
 */
@Component({
  selector: 'ttco-companies',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './companies.html',
  styleUrl: './companies.scss',
})
export class Companies {
  protected readonly points: readonly CompanyValuePoint[] = [
    {
      icon: 'calendar',
      title: 'Se acabó perseguir horarios',
      body: 'El candidato elige de tu disponibilidad real. Ni un correo más de "¿te late el jueves?".',
    },
    {
      icon: 'filter',
      title: 'Señal, no currículums bonitos',
      body: 'Cada perfil llega con lo que la persona ya construyó y con su stack, no con tres páginas de adjetivos.',
    },
    {
      icon: 'check-circle',
      title: 'Cada entrevista deja evidencia',
      body: 'Feedback escrito y comparable entre candidatos. Cuando alguien pregunte por qué ese sí y ese no, la respuesta está escrita.',
    },
  ];
}
