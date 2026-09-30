import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { PageLangService } from '../../core/i18n/page-lang';
import { SHELL_COPY } from '../../core/i18n/shell-copy';
import { ThemeService } from '../../core/theme/theme.service';
import { Icon } from '../icon/icon';

/**
 * The light/dark switch. `ThemeService` already owns every decision — this is
 * only the button that calls `toggle()`.
 *
 * Two accessibility notes worth keeping:
 *
 *  * The accessible name says what pressing it WILL do ("Switch to dark mode"),
 *    not what the current state is. A blind visitor cannot see the icon, so the
 *    state alone tells them nothing actionable.
 *  * ⚠️ It is the ONLY visitor-facing string in this button, it is invisible on
 *    screen, and it therefore went untranslated through the whole of US-009's
 *    first pass: the page read English and the button still announced "Cambiar a
 *    modo oscuro". Nothing in the build or the tests could see it — it was found
 *    by walking the tab order in a real browser and printing the accessible
 *    name of each stop. That is why it now comes from `SHELL_COPY` like the rest
 *    of the shell, and why there is a test below that asserts it per language.
 *  * The name is on `aria-label`, and the icon is `aria-hidden`. No `title`:
 *    a tooltip is not an accessible name and doubles up in some readers.
 *
 * It deliberately does NOT offer "follow the system" as a third state. Someone
 * reaching for a toggle wants the other theme now; `ThemeService.useSystem()`
 * is there for a settings screen when there is one.
 */
@Component({
  selector: 'ttco-theme-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './theme-toggle.html',
  styleUrl: './theme-toggle.scss',
})
export class ThemeToggle {
  private readonly theme = inject(ThemeService);

  /** What is on screen right now — drives which icon is shown. */
  protected readonly resolved = this.theme.resolved;

  private readonly pageLang = inject(PageLangService);

  protected readonly label = computed(() => {
    const copy = SHELL_COPY[this.pageLang.lang()];
    return this.resolved() === 'dark' ? copy.themeToLight : copy.themeToDark;
  });

  /**
   * The icon shows the DESTINATION, never the current state, so that it says
   * the same thing as `label()` above: dark right now means pressing gives you
   * light, so the button shows a sun.
   *
   * Showing the current state instead is the more common choice and it is a
   * trap here — the label would promise light while the icon showed a moon, and
   * a sighted visitor and a screen-reader visitor would read the same button
   * two opposite ways. If this ever flips, flip `label()` in the same commit.
   */
  protected readonly iconName = computed(() => (this.resolved() === 'dark' ? 'sun' : 'moon'));

  protected toggle(): void {
    this.theme.toggle();
  }
}
