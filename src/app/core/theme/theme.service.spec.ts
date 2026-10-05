import { TestBed } from '@angular/core/testing';
import { THEME_STORAGE_KEY, ThemeService } from './theme.service';

function stubMatchMedia(prefersDark: boolean) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const mql = {
    matches: prefersDark,
    media: '(prefers-color-scheme: dark)',
    addEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.add(listener);
    },
    removeEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener);
    },
  };
  (window as unknown as { matchMedia: unknown }).matchMedia = () => mql;
  return {
    emit(nowDark: boolean) {
      mql.matches = nowDark;
      listeners.forEach((listener) => listener({ matches: nowDark } as MediaQueryListEvent));
    },
  };
}

function create(): ThemeService {
  TestBed.configureTestingModule({});
  return TestBed.inject(ThemeService);
}

describe('ThemeService', () => {
  const originalMatchMedia = (window as unknown as { matchMedia?: unknown }).matchMedia;

  beforeEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    (window as unknown as { matchMedia?: unknown }).matchMedia = originalMatchMedia;
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  describe('with nothing stored', () => {
    it('defaults to system and leaves data-theme off so the CSS decides', () => {
      stubMatchMedia(false);
      const service = create();

      expect(service.preference()).toBe('system');
      expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    });

    it('reports the OS theme through resolved() without writing an attribute', () => {
      stubMatchMedia(true);
      const service = create();

      expect(service.resolved()).toBe('dark');
      expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    });

    it('follows the OS live when it changes with the tab open', () => {
      const media = stubMatchMedia(false);
      const service = create();
      expect(service.resolved()).toBe('light');

      media.emit(true);

      expect(service.resolved()).toBe('dark');
      expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    });
  });

  describe('with a stored choice', () => {
    it('applies it to <html> on boot', () => {
      stubMatchMedia(false);
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');

      const service = create();

      expect(service.preference()).toBe('dark');
      expect(service.resolved()).toBe('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('wins over the OS setting', () => {
      stubMatchMedia(true);
      localStorage.setItem(THEME_STORAGE_KEY, 'light');

      const service = create();

      expect(service.resolved()).toBe('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('ignores a value it does not recognise', () => {
      stubMatchMedia(false);
      localStorage.setItem(THEME_STORAGE_KEY, 'neon');

      const service = create();

      expect(service.preference()).toBe('system');
      expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    });
  });

  describe('setPreference', () => {
    it('writes the attribute and persists the choice', () => {
      stubMatchMedia(false);
      const service = create();

      service.setPreference('dark');

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    });

    it('going back to system clears both the attribute and the key', () => {
      stubMatchMedia(false);
      const service = create();
      service.setPreference('dark');

      service.setPreference('system');

      expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
    });

    it('useSystem is the same thing', () => {
      stubMatchMedia(false);
      const service = create();
      service.setPreference('dark');

      service.useSystem();

      expect(service.preference()).toBe('system');
      expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    });
  });

  describe('toggle', () => {
    it('turns an implicit dark into an explicit light', () => {
      stubMatchMedia(true);
      const service = create();

      service.toggle();

      expect(service.preference()).toBe('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('goes back and forth', () => {
      stubMatchMedia(false);
      const service = create();

      service.toggle();
      expect(service.resolved()).toBe('dark');

      service.toggle();
      expect(service.resolved()).toBe('light');
    });
  });

  describe('when the browser is hostile', () => {
    it('survives matchMedia being missing', () => {
      delete (window as unknown as { matchMedia?: unknown }).matchMedia;

      const service = create();

      expect(service.preference()).toBe('system');
      expect(service.resolved()).toBe('light');
    });

    it('still applies the theme when storage throws', () => {
      stubMatchMedia(false);
      const service = create();
      const setItem = Storage.prototype.setItem;
      Storage.prototype.setItem = () => {
        throw new Error('storage disabled');
      };

      try {
        expect(() => service.setPreference('dark')).not.toThrow();

        expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      } finally {
        Storage.prototype.setItem = setItem;
      }
    });
  });
});
