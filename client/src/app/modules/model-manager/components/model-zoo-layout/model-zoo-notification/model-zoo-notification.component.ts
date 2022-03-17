import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wb-model-zoo-notification',
  templateUrl: './model-zoo-notification.component.html',
  styleUrls: ['./model-zoo-notification.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelZooNotificationComponent {
  @Input() message: string;

  isShown = true;
}
