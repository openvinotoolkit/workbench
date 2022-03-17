import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';

import { ModelItem } from '@store/model-store/model.model';
import { DatasetItem } from '@store/dataset-store/dataset.model';

import { DeviceItem } from '@shared/models/device';
import { TargetMachineItem } from '@shared/models/pipelines/target-machines/target-machine';

import { CREATE_PROJECT_STAGES } from '../../../../dashboard/constants';

@Component({
  selector: 'wb-create-project-stages',
  templateUrl: './create-project-stages.component.html',
  styleUrls: ['./create-project-stages.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateProjectStagesComponent {
  @Input() selectedModel: ModelItem;

  @Input() selectedTarget: TargetMachineItem;

  @Input() defaultTarget: TargetMachineItem;

  @Input() selectedDevice: DeviceItem;

  @Input() selectedDataset: DatasetItem;

  @Input() currentStage: CREATE_PROJECT_STAGES;

  @Output() toStage = new EventEmitter<CREATE_PROJECT_STAGES>();

  @Output() resetStage = new EventEmitter<CREATE_PROJECT_STAGES>();

  public createProjectStages = CREATE_PROJECT_STAGES;
}
