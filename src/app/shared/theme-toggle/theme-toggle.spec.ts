import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThemeService } from '../../core/theme/theme.service';
import { ThemeToggle } from './theme-toggle';
import { PageLangService } from '../../core/i18n/page-lang';

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
    expect(button().getAttribute('aria-label')).toBe('Switch to dark mode');
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

    expect(button().getAttribute('aria-label')).toBe('Switch to light mode');
  });

  it('shows the moon while light, the theme pressing it will give you', () => {
    expect(button().getAttribute('aria-label')).toBe('Switch to dark mode');
    expect(iconHref()).toBe('/icons.svg#tt-moon');
  });

  it('shows the sun once dark, still naming the destination', async () => {
    button().click();
    await fixture.whenStable();

    expect(button().getAttribute('aria-label')).toBe('Switch to light mode');
    expect(iconHref()).toBe('/icons.svg#tt-sun');
  });

  it('renders an icon that is hidden from assistive tech', () => {
    const icon = (fixture.nativeElement as HTMLElement).querySelector('svg')!;
    expect(icon.getAttribute('aria-hidden')).toBe('true');
  });
  it('announces the destination in the language of the page it is on', async () => {
    TestBed.inject(PageLangService).set('es-MX');
    await fixture.whenStable();
    expect(button().getAttribute('aria-label')).toBe('Cambiar a modo oscuro');
  });
});
