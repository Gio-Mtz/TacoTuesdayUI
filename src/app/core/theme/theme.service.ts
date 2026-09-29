import { DOCUMENT, Injectable, computed, inject, signal } from '@angular/core';

/** What the visitor chose. 'system' means "don't decide for me". */
export type ThemePreference = 'light' | 'dark' | 'system';

/** What is actually on screen. 'system' has been resolved away. */
export type ResolvedTheme = 'light' | 'dark';

/**
 * Also hard-coded in the anti-flash script in index.html, which has to run
 * before Angular exists. Change one, change the other.
 */
export const THEME_STORAGE_KEY = 'tt-theme';

const DARK_QUERY = '(prefers-color-scheme: dark)';

/**
 * Owns the theme for the whole app.
 *
 * The one idea worth holding on to: for 'system' this service REMOVES the
 * `data-theme` attribute instead of computing light or dark and writing it.
 * theme.css already resolves in that order —
 *
 *   1. [data-theme="dark"] / [data-theme="light"]   explicit choice
 *   2. @media (prefers-color-scheme: dark)          the OS
 *   3. :root                                        light, the default
 *
 * — so an absent attribute IS "follow the OS", handled by the browser with no
 * JavaScript in the loop. Writing a computed value instead would work until the
 * visitor flips their OS to dark with the tab open: the attribute would still
 * say 'light' and the page would disagree with the rest of their machine.
 *
 * `resolved()` still tracks the OS live, because a theme toggle needs to know
 * which icon to show — but that is a read, never the source of truth.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  /** The OS setting, kept live so `resolved()` follows it without a reload. */
  private readonly systemTheme = signal<ResolvedTheme>('light');

  private readonly _preference = signal<ThemePreference>('system');

  /** What the visitor chose, including 'system'. */
  readonly preference = this._preference.asReadonly();

  /** The theme actually rendering. Use this for UI that mirrors the theme. */
  readonly resolved = computed<ResolvedTheme>(() => {
    const preference = this._preference();
    return preference === 'system' ? this.systemTheme() : preference;
  });

  constructor() {
    this.watchSystemTheme();
    this._preference.set(this.readStoredPreference());
    this.applyToDocument(this._preference());
  }

  /** Records the choice, applies it, and persists it. */
  setPreference(preference: ThemePreference): void {
    this._preference.set(preference);
    this.applyToDocument(preference);

    const storage = this.storage();
    if (!storage) {
      return;
    }
    try {
      if (preference === 'system') {
        // Absence of the key is what 'system' means on read. Storing the literal
        // string would work too, but then the index.html script would have to
        // know about a third value.
        storage.removeItem(THEME_STORAGE_KEY);
      } else {
        storage.setItem(THEME_STORAGE_KEY, preference);
      }
    } catch {
      // Quota or a locked-down browser. The theme is already applied for this
      // visit; only the memory of it is lost.
    }
  }

  /**
   * Flips to the opposite of what is on screen. Note this turns 'system' into an
   * explicit choice — which is what someone clicking a toggle is asking for.
   */
  toggle(): void {
    this.setPreference(this.resolved() === 'dark' ? 'light' : 'dark');
  }

  /** Hands control back to the OS. */
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

    // Safari below 14 only has the deprecated addListener.
    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', onChange);
    } else if (typeof query.addListener === 'function') {
      query.addListener(onChange);
    }
    // Never removed on purpose: this service lives as long as the app does.
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
      // Accessing localStorage itself throws when site data is blocked.
      return null;
    }
  }
}
