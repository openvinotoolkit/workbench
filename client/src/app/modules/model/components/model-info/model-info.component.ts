import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { modelDomainNames, ModelItem, TaskTypeToNameMap } from '@store/model-store/model.model';

@Component({
  selector: 'wb-model-info',
  templateUrl: './model-info.component.html',
  styleUrls: ['./model-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelInfoComponent {
  readonly taskTypeToNameMap = TaskTypeToNameMap;

  readonly modelDomainNames = modelDomainNames;

  @Input() model: ModelItem = null;
}
