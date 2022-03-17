import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { isEmpty } from 'lodash';

import {
  ConfigureTargetPipelineStage,
  pipelineStageNameMap,
} from '@shared/models/pipelines/target-machines/configure-target-pipeline';

@Component({
  selector: 'wb-pipeline-stages',
  templateUrl: './pipeline-stages.component.html',
  styleUrls: ['./pipeline-stages.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PipelineStagesComponent {
  @Input()
  stages: ConfigureTargetPipelineStage[] = [];

  isEmpty = isEmpty;
  pipelineStagesNamesMap = pipelineStageNameMap;

  trackStageByType(index: number, { stage }: ConfigureTargetPipelineStage): string {
    return stage;
  }
}
