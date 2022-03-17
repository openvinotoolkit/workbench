import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { Dictionary } from '@ngrx/entity';

import { MessagesService } from '@core/services/common/messages.service';

import { ProjectItem } from '@store/project-store/project.model';
import { ModelDomain, modelDomainNames } from '@store/model-store/model.model';

import { IProfilingPipeline } from '@shared/models/pipelines/profiling-pipeline';
import { IInt8CalibrationPipeline } from '@shared/models/pipelines/int8-calibration-pipeline';
import { LOCAL_PIPELINE_TYPES_WITH_PROFILING } from '@shared/models/pipelines/pipeline';

@Component({
  selector: 'wb-project-info-panel',
  templateUrl: './project-info-panel.component.html',
  styleUrls: ['./project-info-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectInfoPanelComponent {
  @Input() domain: ModelDomain = null;

  @Input() project: ProjectItem;

  @Input() runningProfilingPipeLinePerProjectMap: { [projectId: number]: IProfilingPipeline } = {};
  @Input() runningInt8CalibrationPipeLinePerProjectMap: {
    [projectId: number]: IInt8CalibrationPipeline;
  } = {};

  @Input() devices: Dictionary<string> = {};

  @Output() cancelProfiling = new EventEmitter<number>();

  private readonly _dashboardTooltips = this._messagesService.tooltipMessages.dashboardPage;

  readonly LOCAL_PIPELINE_TYPES_WITH_PROFILING = LOCAL_PIPELINE_TYPES_WITH_PROFILING;

  readonly modelDomainNames = modelDomainNames;

  constructor(private readonly _messagesService: MessagesService) {}

  isNA(value): boolean {
    return !(value || value === 0);
  }

  get readOnlyTipMessage(): string {
    return Number(this.project?.analysisData?.irVersion) <= 10
      ? this._dashboardTooltips.deprecatedIRVersion
      : this._dashboardTooltips.archivedProject;
  }
}
