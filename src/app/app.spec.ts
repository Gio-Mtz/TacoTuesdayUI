import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');

    await TestBed.configureTestingModule({
      imports: [App],
      // App renders a <router-outlet>, so the router has to exist in the
      // testing module or the component cannot be created.
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the router outlet', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });

  it('frames every route with the header and the footer', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('ttco-site-header header')).toBeTruthy();
    expect(compiled.querySelector('ttco-site-footer footer')).toBeTruthy();
  });

  it('puts the routed page inside a focusable main landmark', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const main = (fixture.nativeElement as HTMLElement).querySelector('main')!;

    expect(main.id).toBe('contenido');
    // -1 keeps it out of the tab order but lets the skip link land focus on it.
    expect(main.getAttribute('tabindex')).toBe('-1');
    expect(main.querySelector('router-outlet')).toBeTruthy();
  });

  it('opens the tab order with a skip link that targets that main', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const skip = compiled.querySelector('a')!;

    expect(skip.classList.contains('tt-skip-link')).toBe(true);
    expect(skip.getAttribute('href')).toBe('#contenido');
  });
});
