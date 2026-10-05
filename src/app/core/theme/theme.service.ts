import { DOCUMENT, Injectable, computed, inject, signal } from '@angular/core';

export type ThemePreference = 'light' | 'dark' | 'system';

export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'tt-theme';

const DARK_QUERY = '(prefers-color-scheme: dark)';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  private readonly systemTheme = signal<ResolvedTheme>('light');

  private readonly _preference = signal<ThemePreference>('system');

  readonly preference = this._preference.asReadonly();

  readonly resolved = computed<ResolvedTheme>(() => {
    const preference = this._preference();
    return preference === 'system' ? this.systemTheme() : preference;
  });

  constructor() {
    this.watchSystemTheme();
    this._preference.set(this.readStoredPreference());
    this.applyToDocument(this._preference());
  }

  setPreference(preference: ThemePreference): void {
    this._preference.set(preference);
    this.applyToDocument(preference);

    const storage = this.storage();
    if (!storage) {
      return;
    }
    try {
      if (preference === 'system') {
        storage.removeItem(THEME_STORAGE_KEY);
      } else {
        storage.setItem(THEME_STORAGE_KEY, preference);
      }
    } catch {
    }
  }

  toggle(): void {
    this.setPreference(this.resolved() === 'dark' ? 'light' : 'dark');
  }

  useSystem(): void {
    this.setPreference('system');
  }

  private applyToDocument(preference: ThemePreference): void {
    const root = this.document.documentElement;
    if (preference === 'system') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', preference);
    }
  }

  private readStoredPreference(): ThemePreference {
    const storage = this.storage();
    if (!storage) {
      return 'system';
    }
    try {
      const raw = storage.getItem(THEME_STORAGE_KEY);
      return raw === 'light' || raw === 'dark' ? raw : 'system';
    } catch {
      return 'system';
    }
  }

  private watchSystemTheme(): void {
    const query = this.darkQuery();
    if (!query) {
      return;
    }
    this.systemTheme.set(query.matches ? 'dark' : 'light');

    const onChange = (event: MediaQueryListEvent): void => {
      this.systemTheme.set(event.matches ? 'dark' : 'light');
    };

    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', onChange);
    } else if (typeof query.addListener === 'function') {
      query.addListener(onChange);
    }
  }

  private darkQuery(): MediaQueryList | null {
    const view = this.document.defaultView;
    if (!view || typeof view.matchMedia !== 'function') {
      return null;
    }
    try {
      return view.matchMedia(DARK_QUERY);
    } catch {
      return null;
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
