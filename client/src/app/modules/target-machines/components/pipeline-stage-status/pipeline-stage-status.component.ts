import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

import { PipelineStageStatusNames } from '@shared/models/pipelines/target-machines/configure-target-pipeline';

@Component({
  selector: 'wb-pipeline-stage-status',
  templateUrl: './pipeline-stage-status.component.html',
  styleUrls: ['./pipeline-stage-status.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PipelineStageStatusComponent {
  @Input()
  status: PipelineStageStatusNames;

  public readonly statusToIconMap = {
    [PipelineStageStatusNames.QUEUED]: 'hourglass',
    [PipelineStageStatusNames.IN_PROGRESS]: 'spinner',
    [PipelineStageStatusNames.SUCCESS]: 'check',
    [PipelineStageStatusNames.FAILURE]: 'warning',
    [PipelineStageStatusNames.WARNING]: 'warning',
  };

  public readonly statusToTextMap = {
    [PipelineStageStatusNames.QUEUED]: 'Queued',
    [PipelineStageStatusNames.IN_PROGRESS]: 'In Progress',
    [PipelineStageStatusNames.SUCCESS]: 'Success',
    [PipelineStageStatusNames.FAILURE]: 'Failure',
    [PipelineStageStatusNames.WARNING]: 'Warning',
  };
}
