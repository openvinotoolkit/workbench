import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

type InfoHintType = 'default' | 'warning' | 'attention';

export interface InfoHint {
  type: InfoHintType;
  message: string;
}

@Component({
  selector: 'wb-info-hint',
  templateUrl: './info-hint.component.html',
  styleUrls: ['./info-hint.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoHintComponent {
  @Input()
  type: InfoHintType = 'default';

  @Input()
  message: string;
}
