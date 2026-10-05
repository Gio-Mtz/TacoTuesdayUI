import { Component, inject, signal } from '@angular/core';
import { HealthService } from './health.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'ttco-health-component',
  imports: [],
  templateUrl: './health.component.html',
  styleUrl: './health.component.scss',
})
export class HealthComponent {
  private readonly healthService = inject(HealthService);
  protected readonly error = signal<string | null>(null);
  protected readonly ping = toSignal(this.healthService.ping('Gio'), { initialValue: null });
}
