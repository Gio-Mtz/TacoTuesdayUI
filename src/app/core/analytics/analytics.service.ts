import { DOCUMENT, InjectionToken, Injectable, effect, inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import { ConsentService } from './consent.service';
import { isValidMeasurementId } from './consent';

export const GTAG_SCRIPT_ID = 'tt-ga4';

export const GA_COOKIE_PREFIXES = ['_ga', '_gid', '_gat'];

export const ANALYTICS_MEASUREMENT_ID = new InjectionToken<string>('ANALYTICS_MEASUREMENT_ID', {
  providedIn: 'root',
  factory: () => environment.analyticsMeasurementId,
});

interface AnalyticsWindow extends Window {
  dataLayer?: unknown[][];
  gtag?: (...args: readonly unknown[]) => void;
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly document = inject(DOCUMENT);

  private readonly consent = inject(ConsentService);

  readonly measurementId = inject(ANALYTICS_MEASUREMENT_ID);

  readonly configured = isValidMeasurementId(this.measurementId);

  constructor() {
    effect(() => {
      this.consent.state();
      this.sync();
    });
  }

  sync(): void {
    if (this.consent.granted()) {
      this.load();
      return;
    }
    this.revoke();
  }

  isLoaded(): boolean {
    return this.document.getElementById(GTAG_SCRIPT_ID) !== null;
  }

  private load(): void {
    if (!this.configured || this.isLoaded()) {
      return;
    }

    const view = this.view();
    if (!view) {
      return;
    }

    const dataLayer = (view.dataLayer ??= []);
    const push = (...args: unknown[]): void => {
      dataLayer.push(args);
    };
    view.gtag ??= push;

    push('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'granted',
    });
    push('js', new Date());
    push('config', this.measurementId, {
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });

    const script = this.document.createElement('script');
    script.id = GTAG_SCRIPT_ID;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(this.measurementId)}`;
    this.document.head.appendChild(script);
  }

  private revoke(): void {
    const view = this.view();
    view?.gtag?.('consent', 'update', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
    });
    this.clearCookies();
  }

  private clearCookies(): void {
    const cookies = this.document.cookie;
    if (!cookies) {
      return;
    }

    const host = this.document.location?.hostname ?? '';
    const domains = host ? ['', host, `.${host}`] : [''];

    for (const entry of cookies.split(';')) {
      const name = entry.split('=')[0]?.trim();
      if (!name || !GA_COOKIE_PREFIXES.some((prefix) => name.startsWith(prefix))) {
        continue;
      }
      for (const domain of domains) {
        const scope = domain ? `; domain=${domain}` : '';
        this.document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT${scope}`;
      }
    }
  }

  private view(): AnalyticsWindow | null {
    return (this.document.defaultView as AnalyticsWindow | null) ?? null;
  }
}
