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

  it('renders an icon that is hidden from assistive tech', () => {
    const icon = (fixture.nativeElement as HTMLElement).querySelector('svg')!;
    expect(icon.getAttribute('aria-hidden')).toBe('true');
  });
});
