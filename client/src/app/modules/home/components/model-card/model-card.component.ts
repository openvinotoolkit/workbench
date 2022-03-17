import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';

import { ModelItem, TaskTypeToNameMap } from '@store/model-store/model.model';

@Component({
  selector: 'wb-model-card',
  templateUrl: './model-card.component.html',
  styleUrls: ['./model-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelCardComponent {
  @Input() model: ModelItem;

  @Output() openModel = new EventEmitter<ModelItem>();

  public taskTypeToNameMap = TaskTypeToNameMap;
}
