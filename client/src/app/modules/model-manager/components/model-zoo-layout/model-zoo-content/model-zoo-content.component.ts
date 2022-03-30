import { ChangeDetectionStrategy, Component, ViewChild, HostBinding, Input, TemplateRef } from '@angular/core';

import { MessagesService } from '@core/services/common/messages.service';

@Component({
  selector: 'wb-model-zoo-content',
  templateUrl: './model-zoo-content.component.html',
  styleUrls: ['./model-zoo-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelZooContentComponent {
  @Input() loading = false;
  @Input() hasError = false;

  @ViewChild('emptyFilteredModelsTemplate') emptyFilteredModelsTemplate: TemplateRef<unknown>;

  readonly emptyFilteredModelsMessage = this._messagesService.hintMessages.modelZooImport.emptyFilteredModels;

  constructor(private readonly _messagesService: MessagesService) {}
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
