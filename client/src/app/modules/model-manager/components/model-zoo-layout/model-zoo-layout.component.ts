import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wb-model-zoo-layout',
  templateUrl: './model-zoo-layout.component.html',
  styleUrls: ['./model-zoo-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelZooLayoutComponent {
  @Input() isDetailsOpened = false;
}
