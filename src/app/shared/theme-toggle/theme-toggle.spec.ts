import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThemeService } from '../../core/theme/theme.service';
import { ThemeToggle } from './theme-toggle';

/**
 * jsdom has no matchMedia, which ThemeService already handles by falling back
 * to 'light'. That is exactly the starting state these tests want, so nothing
 * is stubbed here — see theme.service.spec.ts for the OS-setting cases.
 */
describe('ThemeToggle', () => {
  let fixture: ComponentFixture<ThemeToggle>;

  beforeEach(async () => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');

    await TestBed.configureTestingModule({ imports: [ThemeToggle] }).compileComponents();
    fixture = TestBed.createComponent(ThemeToggle);
    await fixture.whenStable();
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  function button(): HTMLButtonElement {
    return (fixture.nativeElement as HTMLElement).querySelector('button')!;
  }

  function iconHref(): string {
    return (fixture.nativeElement as HTMLElement).querySelector('use')!.getAttribute('href')!;
  }

  it('names the action it will perform, not the state it is in', () => {
    expect(button().getAttribute('aria-label')).toBe('Cambiar a modo oscuro');
  });

  it('switches the document to dark when pressed', async () => {
    button().click();
    await fixture.whenStable();

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(TestBed.inject(ThemeService).resolved()).toBe('dark');
  });

  it('updates its own label once the theme changed', async () => {
    button().click();
    await fixture.whenStable();

    expect(button().getAttribute('aria-label')).toBe('Cambiar a modo claro');
  });

  // TD-004. Before this the button showed `tt-star` / `tt-eye`: the aria-label
  // said exactly what would happen and the icon said nothing at all, so anyone
  // not using a screen reader had to press it to find out. These two tests pin
  // the contract that makes the icon worth having — it names the DESTINATION,
  // the same thing the label promises. An icon that drifts back to showing the
  // current state makes the button contradict itself, and nothing else catches
  // that: `ng build` is happy either way.
  it('shows the moon while light, the theme pressing it will give you', () => {
    expect(button().getAttribute('aria-label')).toBe('Cambiar a modo oscuro');
    expect(iconHref()).toBe('/icons.svg#tt-moon');
  });

  it('shows the sun once dark, still naming the destination', async () => {
    button().click();
    await fixture.whenStable();

    expect(button().getAttribute('aria-label')).toBe('Cambiar a modo claro');
    expect(iconHref()).toBe('/icons.svg#tt-sun');
  });

  // WHAT THESE TWO TESTS CANNOT SEE, on purpose, so nobody assumes they do:
  // whether `tt-sun` and `tt-moon` actually EXIST inside `public/icons.svg`.
  // The sprite is a byte-for-byte copy of the design system's and lives in
  // `public/`, which the bundler copies without ever looking inside. So the
  // component can name a symbol that is not there, the `<use>` resolves to
  // nothing, the button renders EMPTY — and every test in this file still
  // passes, because they assert the href string, not the artwork.
  // A test was tried and dropped: the unit-test builder has no `@types/node`,
  // so a spec cannot read a file from disk, and adding node types to the test
  // tsconfig to cover one assertion is a worse trade than saying this plainly.
  // The guard is EVIDENCE instead, the same deal `fileReplacements` got in
  // US-006: a grep of the emitted `dist/.../icons.svg` for both ids, pasted in
  // the work log. If you change the sprite, repeat the grep.

  it('renders an icon that is hidden from assistive tech', () => {
    const icon = (fixture.nativeElement as HTMLElement).querySelector('svg')!;
    expect(icon.getAttribute('aria-hidden')).toBe('true');
  });
});
