import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';

import { MessagesService } from '@core/services/common/messages.service';

import { ProjectItem } from '@store/project-store/project.model';

import { IProfilingPipeline } from '@shared/models/pipelines/profiling-pipeline';
import { IInt8CalibrationPipeline } from '@shared/models/pipelines/int8-calibration-pipeline';
import { LOCAL_PIPELINE_TYPES_WITH_PROFILING } from '@shared/models/pipelines/pipeline';

@Component({
  selector: 'wb-project-progress',
  templateUrl: './project-progress.component.html',
  styleUrls: ['./project-progress.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectProgressComponent {
  @Input() project: ProjectItem;
  @Input() runningProfilingPipeLinePerProjectMap: { [projectId: number]: IProfilingPipeline } = {};
  @Input() runningInt8CalibrationPipeLinePerProjectMap: {
    [projectId: number]: IInt8CalibrationPipeline;
  } = {};

  @Output() cancelProfiling = new EventEmitter<number>();

  readonly LOCAL_PIPELINE_TYPES_WITH_PROFILING = LOCAL_PIPELINE_TYPES_WITH_PROFILING;

  constructor(private readonly _messagesService: MessagesService) {}

  getProjectProgressNote(progressType: string): string {
    return this._messagesService.getHint('projectProgress', 'note', {
      progressType,
    });
  }
}
