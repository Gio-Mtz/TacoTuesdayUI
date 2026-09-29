import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * One icon from the sprite in `public/icons.svg`.
 *
 * The sprite is referenced, not inlined: the browser fetches `icons.svg` once
 * and every `<use>` after that is free, which is the whole reason US-001 built
 * a sprite instead of 28 separate files.
 *
 * Each `<symbol>` in the sprite already declares `stroke="currentColor"`, so an
 * icon takes the colour of whatever text it sits next to. Set `color` on the
 * parent, never a fill here.
 *
 * Always `aria-hidden`: an icon in this product decorates a label, it never
 * replaces one. If you catch yourself wanting to name an icon for a screen
 * reader, the button is missing its text.
 */
@Component({
  selector: 'ttco-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      aria-hidden="true"
      focusable="false"
    >
      <use [attr.href]="href()"></use>
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
    }
  `,
})
export class Icon {
  /** Symbol id without the `tt-` prefix, e.g. `calendar` for `#tt-calendar`. */
  readonly name = input.required<string>();

  /** Square side in px. 24 is the grid the sprite was drawn on. */
  readonly size = input(24);

  /**
   * Absolute on purpose. A relative `icons.svg#…` would resolve against the
   * current route, so the same icon would 404 on `/privacidad` and work on `/`.
   */
  protected readonly href = computed(() => `/icons.svg#tt-${this.name()}`);
}
