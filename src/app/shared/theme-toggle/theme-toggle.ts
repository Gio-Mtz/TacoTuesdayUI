import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { ThemeService } from '../../core/theme/theme.service';
import { Icon } from '../icon/icon';

/**
 * The light/dark switch. `ThemeService` already owns every decision — this is
 * only the button that calls `toggle()`.
 *
 * Two accessibility notes worth keeping:
 *
 *  * The accessible name says what pressing it WILL do ("Cambiar a modo
 *    oscuro"), not what the current state is. A blind visitor cannot see the
 *    icon, so the state alone tells them nothing actionable.
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

  protected readonly label = computed(() =>
    this.resolved() === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro',
  );

  /** `eye` for "lights on", `star` for night. Both exist in the sprite. */
  protected readonly iconName = computed(() => (this.resolved() === 'dark' ? 'eye' : 'star'));

  protected toggle(): void {
    this.theme.toggle();
  }
}
