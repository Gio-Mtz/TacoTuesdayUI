import { ChangeDetectionStrategy, Component } from '@angular/core';

import { SITE_INFO } from '../../core/site/site-info';

/**
 * Aviso de privacidad simplificado.
 *
 * Required from the moment the landing captures an email, which is US-003 —
 * this ships with US-002 so the footer link is never a dead end. It covers what
 * the LFPDPPP asks a short notice to cover: who collects, what, why, and how to
 * revoke.
 *
 * It is written against what the product actually does today: one email, one
 * name, and the fields the waitlist form will ask for. Every time that list
 * changes, this page changes with it — that is the point of a notice.
 *
 * Not reviewed by a lawyer. Flagged for Gio in the work log; a real review is
 * cheap now and expensive after the first person asks for their data back.
 */
@Component({
  selector: 'ttco-privacy',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './privacy.html',
  styleUrl: './privacy.scss',
})
export class Privacy {
  protected readonly site = SITE_INFO;
}
