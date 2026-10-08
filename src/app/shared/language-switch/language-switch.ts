import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PageLangService } from '../../core/i18n/page-lang';
import { languageSwitchFor } from '../../core/i18n/language-switch';
import { SHELL_COPY } from '../../core/i18n/shell-copy';
import { PageSocialMetaService } from '../../core/seo/page-social';

@Component({
  selector: 'ttco-language-switch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './language-switch.html',
  styleUrl: './language-switch.scss',
})
export class LanguageSwitch {
  private readonly pageLang = inject(PageLangService);

  private readonly social = inject(PageSocialMetaService);

  protected readonly copy = computed(() => SHELL_COPY[this.pageLang.lang()]);

  // Null on every route that has no translation, and the template renders
  // nothing at all in that case. A disabled control would be worse than no
  // control: it promises a language that does not exist.
  protected readonly target = computed(() => languageSwitchFor(this.social.card()));
}
