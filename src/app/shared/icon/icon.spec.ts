import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Icon } from './icon';

describe('Icon', () => {
  let fixture: ComponentFixture<Icon>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Icon] }).compileComponents();
    fixture = TestBed.createComponent(Icon);
  });

  function svg(): SVGElement {
    return (fixture.nativeElement as HTMLElement).querySelector('svg')!;
  }

  it('points at the sprite with an absolute path so it works on any route', async () => {
    fixture.componentRef.setInput('name', 'calendar');
    await fixture.whenStable();

    expect(svg().querySelector('use')!.getAttribute('href')).toBe('/icons.svg#tt-calendar');
  });

  it('is hidden from assistive tech — an icon here never replaces a label', async () => {
    fixture.componentRef.setInput('name', 'mail');
    await fixture.whenStable();

    expect(svg().getAttribute('aria-hidden')).toBe('true');
    expect(svg().getAttribute('focusable')).toBe('false');
  });

  it('defaults to the 24 px grid the sprite was drawn on', async () => {
    fixture.componentRef.setInput('name', 'mail');
    await fixture.whenStable();

    expect(svg().getAttribute('width')).toBe('24');
    expect(svg().getAttribute('height')).toBe('24');
  });

  it('honours an explicit size', async () => {
    fixture.componentRef.setInput('name', 'mail');
    fixture.componentRef.setInput('size', 20);
    await fixture.whenStable();

    expect(svg().getAttribute('width')).toBe('20');
  });
});
