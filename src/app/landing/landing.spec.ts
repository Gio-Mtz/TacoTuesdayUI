import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { routes } from '../app.routes';
import { Landing } from './landing';

describe('Landing', () => {
  let fixture: ComponentFixture<Landing>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Landing],
      providers: [provideRouter(routes)],
    }).compileComponents();

    fixture = TestBed.createComponent(Landing);
    await fixture.whenStable();
  });

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('tells the whole argument in five sections', () => {
    expect(el().querySelectorAll('section').length).toBe(5);
  });

  it('keeps the order of the argument: what it is, who pays, who shows up, how, the ask', () => {
    const ids = Array.from(el().querySelectorAll('section')).map((s) => s.id);
    expect(ids).toEqual(['', 'empresas', 'candidatos', 'como-funciona', 'lista-de-espera']);
  });

  it('puts the only thing that asks for something last', () => {
    // US-003 added the form deliberately at the end, after every reason to say
    // yes. If this ever moves up, the change was not an accident of ordering.
    const sections = Array.from(el().querySelectorAll('section'));
    expect(sections[sections.length - 1].id).toBe('lista-de-espera');
  });

  it('has exactly one <h1> so the heading outline is valid', () => {
    expect(el().querySelectorAll('h1').length).toBe(1);
  });
});
