import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { HEALTH_COPY } from './health-copy';
import { HealthService } from './health.service';
import { PageLangService } from '../../core/i18n/page-lang';

@Component({
  selector: 'ttco-health-component',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './health.component.html',
  styleUrl: './health.component.scss',
})
export class HealthComponent {
  private readonly healthService = inject(HealthService);

  private readonly pageLang = inject(PageLangService);

  protected readonly error = signal<string | null>(null);

  protected readonly copy = computed(() => HEALTH_COPY[this.pageLang.lang()]);

  protected readonly ping = toSignal(this.healthService.ping('Gio'), { initialValue: null });
}
