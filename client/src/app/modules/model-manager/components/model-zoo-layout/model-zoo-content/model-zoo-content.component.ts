import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';

@Component({
  selector: 'wb-model-zoo-content',
  templateUrl: './model-zoo-content.component.html',
  styleUrls: ['./model-zoo-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelZooContentComponent {
  @Input() loading = false;
  @Input() hasError = false;
}

@Component({
  selector: 'wb-model-zoo-counter',
  template: '{{ counterLabel }}: {{ filteredDataLength }}',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelZooCounterComponent<T> {
  @Input() dataLength: number = null;
  @Input() filteredDataLength: number = null;

  @HostBinding('class') hostClass = 'wb-chip';

  get counterLabel(): string {
    return this.filteredDataLength === this.dataLength ? 'Total Models' : 'Total Founds';
  }
}
