import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { PageLangService } from '../../core/i18n/page-lang';
import { SHELL_COPY } from '../../core/i18n/shell-copy';
import { ThemeService } from '../../core/theme/theme.service';
import { Icon } from '../icon/icon';

@Component({
  selector: 'ttco-theme-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './theme-toggle.html',
  styleUrl: './theme-toggle.scss',
})
export class ThemeToggle {
  private readonly theme = inject(ThemeService);

  protected readonly resolved = this.theme.resolved;

  private readonly pageLang = inject(PageLangService);

  protected readonly label = computed(() => {
    const copy = SHELL_COPY[this.pageLang.lang()];
    return this.resolved() === 'dark' ? copy.themeToLight : copy.themeToDark;
  });

  protected readonly iconName = computed(() => (this.resolved() === 'dark' ? 'sun' : 'moon'));

  protected toggle(): void {
    this.theme.toggle();
  }
}
