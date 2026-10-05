import { ChangeDetectionStrategy, Component } from '@angular/core';

import { SITE_INFO } from '../../core/site/site-info';

@Component({
  selector: 'ttco-privacy',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './privacy.html',
  styleUrl: './privacy.scss',
})
export class Privacy {
  protected readonly site = SITE_INFO;
}
