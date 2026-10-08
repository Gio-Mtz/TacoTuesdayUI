import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { CONSENT_COPY } from '../../core/analytics/consent-copy';
import { ConsentService } from '../../core/analytics/consent.service';
import { SITE_INFO } from '../../core/site/site-info';

@Component({
  selector: 'ttco-privacy',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './privacy.html',
  styleUrl: './privacy.scss',
})
export class Privacy {
  private readonly consent = inject(ConsentService);

  protected readonly site = SITE_INFO;

  protected readonly copy = CONSENT_COPY['es-MX'];

  protected readonly consentLabel = computed(() => {
    const state = this.consent.state();
    if (state === 'granted') {
      return this.copy.manageGranted;
    }
    return state === 'denied' ? this.copy.manageDenied : this.copy.manageUnset;
  });

  protected changeChoice(): void {
    this.consent.reset();
  }
}
