import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

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
  readonly name = input.required<string>();

  readonly size = input(24);

  protected readonly href = computed(() => `/icons.svg#tt-${this.name()}`);
}
