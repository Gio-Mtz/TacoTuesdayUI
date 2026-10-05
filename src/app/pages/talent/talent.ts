import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Waitlist } from '../../landing/sections/waitlist/waitlist';
import { Icon } from '../../shared/icon/icon';

/** One promise to the engineer, in the terms they already complain in. */
export interface TalentValuePoint {
  readonly icon: string;
  readonly title: string;
  readonly body: string;
}

/** A numbered step. The number is rendered from the position, never typed. */
export interface TalentStep {
  readonly icon: string;
  readonly title: string;
  readonly body: string;
}

/**
 * `/talento` — the page the engineer is actually sent to.
 *
 * **Why a page and not a section of `/`.** This is the link that goes into
 * WhatsApp groups, community Slacks and LinkedIn posts, and that channel — not
 * the home page — is how devs arrive. A section of `/` would mean either giving
 * the first screen to the audience that does not pay, or sending a dev to a page
 * written for a hiring manager and asking them to scroll past it. A whole page
 * costs one route and lets both audiences be addressed properly.
 *
 * **Why Spanish, when `/` is English.** US-009 put `/` in English because the
 * company that pays reads English. This audience does not: a Mexican dev reads
 * Spanish, and the stakeholder's own line — the one `brand.md` calls "the brand"
 * — only works in Spanish. It is rendered here **verbatim**, in the `<h1>`:
 *
 *   «¿Odias que los reclutas te ghosteen? Deja que ellos te busquen»
 *
 * On `/` the same sentence is translated to "Tired of recruiters ghosting you?
 * Let them come to you", which is a downgrade we accepted there and do not accept
 * here. `ghosteen` is a word a Mexican dev has said out loud; `ghosting you` is
 * merely correct.
 *
 * **These two pages are not translations of each other.** `/` argues to a buyer,
 * this argues to a candidate, and the day one of them changes the other does not
 * have to. The only shared text on the page is the FORM — three fields and one
 * POST, which cannot mean something different per audience — and that is why
 * `waitlist-copy.ts` exists and the form component is reused rather than copied.
 *
 * **The step numbers are visible text here, not a ghosted decoration.** On `/`
 * they are a large `--tt-border-strong` number marked `aria-hidden` with the
 * count repeated for screen readers, and TD-008 measured that at 1.88:1 — below
 * the 3:1 that size of bold text needs. Rather than reproduce a known contrast
 * defect on a new page while the fix waits on a design decision, the number is
 * part of the heading and inherits the title colour, which US-009 measured at
 * 4.58:1 or better. One element instead of two, and nothing to hide from
 * assistive tech.
 */
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
