import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Icon } from '../../../shared/icon/icon';

/** One promise to the engineer, in the terms they already complain in. */
export interface CandidateValuePoint {
  readonly icon: string;
  readonly title: string;
  readonly body: string;
}

/**
 * The "For engineers" section.
 *
 * ⚠️ The heading is the one piece of copy on this page that was NOT up for
 * editing: it is the stakeholder's own sentence, and `brand.md` calls it "the
 * brand". In Spanish it reads "¿Odias que los reclutas te ghosteen? Deja que
 * ellos te busquen". US-009 renders it in English as "Tired of recruiters
 * ghosting you? Let them come to you" — a translation, and therefore a
 * downgrade, because "ghosteen" is a Spanglish verb a Mexican dev has actually
 * said out loud and "ghosting you" is merely correct.
 *
 * That loss is the whole argument for US-010: the SPANISH ORIGINAL survives
 * verbatim on `/talento`, which is the page this audience will actually be sent
 * to (LinkedIn, WhatsApp, community Slacks). This English version exists for the
 * visitor who lands on `/` — including the buyer, to whom "we do not ghost your
 * candidates" is itself a selling point, because the candidate experience is
 * their employer brand.
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
      title: 'Judged on what you can build',
      body: 'Your stack and what you have shipped go first. No filters asking for 5 years in a technology that is 3 years old.',
    },
    {
      icon: 'bell',
      title: 'You are never left without an answer',
      body: 'You know which step you are on and when the next one happens. If it is a no, you get a no, not three weeks of silence.',
    },
    {
      icon: 'chat',
      title: 'Feedback you can use',
      body: 'What they expected, what they saw and what was missing. In writing, so the next interview goes better.',
    },
  ];
}
