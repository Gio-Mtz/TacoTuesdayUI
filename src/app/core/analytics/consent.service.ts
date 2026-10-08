import { DOCUMENT, Injectable, computed, inject, signal } from '@angular/core';

import { CONSENT_STORAGE_KEY, ConsentState } from './consent';

@Injectable({ providedIn: 'root' })
export class ConsentService {
  private readonly document = inject(DOCUMENT);

  private readonly current = signal<ConsentState>('unset');

  readonly state = this.current.asReadonly();

  readonly decided = computed(() => this.current() !== 'unset');

  readonly granted = computed(() => this.current() === 'granted');

  constructor() {
    this.current.set(this.readStored());
  }

  grant(): void {
    this.persist('granted');
  }

  deny(): void {
    this.persist('denied');
  }

  reset(): void {
    this.current.set('unset');

    const storage = this.storage();
    if (!storage) {
      return;
    }
    try {
      storage.removeItem(CONSENT_STORAGE_KEY);
    } catch {
    }
  }

  private persist(state: Exclude<ConsentState, 'unset'>): void {
    this.current.set(state);

    const storage = this.storage();
    if (!storage) {
      return;
    }
    try {
      storage.setItem(CONSENT_STORAGE_KEY, state);
    } catch {
    }
  }

  private readStored(): ConsentState {
    const storage = this.storage();
    if (!storage) {
      return 'unset';
    }
    try {
      const raw = storage.getItem(CONSENT_STORAGE_KEY);
      return raw === 'granted' || raw === 'denied' ? raw : 'unset';
    } catch {
      return 'unset';
    }
  }

  private storage(): Storage | null {
    try {
      return this.document.defaultView?.localStorage ?? null;
    } catch {
      return null;
    }
  }
}
