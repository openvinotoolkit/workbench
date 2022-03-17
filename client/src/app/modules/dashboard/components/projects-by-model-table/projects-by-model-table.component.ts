import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { Dictionary } from '@ngrx/entity';
import { find, get, isEmpty, keyBy } from 'lodash';

import { MessagesService } from '@core/services/common/messages.service';

import {
  optimizationAlgorithmNamesMap,
  OptimizationAlgorithmPresetNames,
  optimizationJobNamesMap,
  OptimizationJobTypes,
  ProjectItem,
  ProjectStatus,
  ProjectStatusNames,
} from '@store/project-store/project.model';
import { ProjectConverterService } from '@store/project-store/project-converter.service';
import { ModelDomain } from '@store/model-store/model.model';
import { InferenceUtils } from '@store/inference-history-store/inference-history.model';

import { TargetMachineItem, TargetMachineTypes } from '@shared/models/pipelines/target-machines/target-machine';
import { IProfilingPipeline } from '@shared/models/pipelines/profiling-pipeline';
import { IInt8CalibrationPipeline } from '@shared/models/pipelines/int8-calibration-pipeline';

@Component({
  selector: 'wb-projects-by-model-table',
  templateUrl: './projects-by-model-table.component.html',
  styleUrls: ['./projects-by-model-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsByModelTableComponent {
  @Input() projectItems: ProjectItem[];

  @Input() selectedProjectId: number;

  @Input() devices: Dictionary<string> = {};

  @Input() targetMachines: Dictionary<TargetMachineItem> = null;

  @Input() runningProfilingPipeLinePerProjectMap: { [projectId: number]: IProfilingPipeline } = {};
  @Input() runningInt8CalibrationPipeLinePerProjectMap: {
    [projectId: number]: IInt8CalibrationPipeline;
  } = {};

  @Input() set domain(value: ModelDomain) {
    this.throughputUnit = InferenceUtils.getThroughputUnit(value);
  }

  @Output() cancelProfiling = new EventEmitter<number>();

  @Output() openProject = new EventEmitter<ProjectItem>();

  @Output() goToCompare = new EventEmitter<ProjectItem>();

  @Output() deleteProjectItem = new EventEmitter<ProjectItem>();

  @Output() selectedDetails = new EventEmitter<ProjectItem>();

  columns = [
    'modelName',
    'optimizationType',
    'datasetName',
    'deviceName',
    'precisions',
    'execInfo.throughput',
    'execInfo.accuracy',
    'creationTimestamp',
    'status',
    'details',
    'open',
    'actions',
  ];

  readonly optimizationJobNamesMap = optimizationJobNamesMap;
  readonly optimizationAlgorithmNamesMap = optimizationAlgorithmNamesMap;
  readonly optimizationAlgorithmPresetNames = OptimizationAlgorithmPresetNames;
  readonly OptimizationJobTypes = OptimizationJobTypes;

  readonly int8ConfigTooltipMap = this.tooltipService.tooltipMessages.optimizationForm;
  readonly dashboardTooltips = this.tooltipService.tooltipMessages.dashboardPage;
  readonly projectsTableHints = this.tooltipService.hintMessages.projectsTable;

  readonly getDeviceName = ProjectItem.getDeviceName;

  readonly projectStatusNames = ProjectStatusNames;

  throughputUnit: string = null;

  constructor(public tooltipService: MessagesService, private projectConverterService: ProjectConverterService) {}

  getProjectStatusWithDescendants(item: ProjectItem): ProjectStatus {
    const currentItemStatus = get<ProjectItem, 'status'>(item, 'status');
    if (item.isExpanded || isEmpty(item.children)) {
      return currentItemStatus;
    }

    return item.children.reduce((acc: ProjectStatus, childId: number) => {
      const childItem = find<ProjectItem>(this.projectItems, ['id', childId]);

      if (!childItem) {
        return acc;
      }

      const status = this.getProjectStatusWithDescendants(childItem);

      return this.getStatusPriority(status) > this.getStatusPriority(acc) ? status : acc;
    }, currentItemStatus);
  }

  selectProjectDetails(project: ProjectItem): void {
    if (project.status.name !== ProjectStatusNames.READY) {
      return;
    }

    this.selectedDetails.emit(project);
  }

  isDeleteAvailable(project: ProjectItem): boolean {
    const { children } = project;
    const projectItemsMap = keyBy(this.projectItems, (i) => i.id);
    const childrenIdsDeep = this.projectConverterService.getAllLevelsDescendants(children, projectItemsMap);
    const projectIds = [project.id, ...childrenIdsDeep].map(Number);
    const projectsOrPipelinesToCheck = projectIds.reduce((acc, projectId) => {
      const projectItem = projectItemsMap[projectId];
      const profilingPipeline = this.runningProfilingPipeLinePerProjectMap[projectId];
      const int8CalibrationPipeline = this.runningInt8CalibrationPipeLinePerProjectMap[projectId];
      acc.push(projectItem, profilingPipeline, int8CalibrationPipeline);

      return acc;
    }, []);
    return !projectsOrPipelinesToCheck.some((item) =>
      [ProjectStatusNames.QUEUED, ProjectStatusNames.RUNNING].includes(item?.status?.name)
    );
  }

  hasAccuracyResult(project: ProjectItem): boolean {
    return Boolean(project?.execInfo?.accuracy) || project?.execInfo?.accuracy === 0;
  }

  isRemoteTarget(project: ProjectItem): boolean {
    return this.targetMachines && this.targetMachines[project?.targetId]?.targetType === TargetMachineTypes.REMOTE;
  }

  private getStatusPriority(status: ProjectStatus): number {
    return ProjectStatus.priority[status.name];
  }

  getReadOnlyTipMessage({ id }: ProjectItem): string {
    const project = this.projectItems.find((item) => item.id === id);
    return Number(project?.analysisData?.irVersion) <= 10
      ? this.dashboardTooltips.deprecatedIRVersion
      : this.dashboardTooltips.archivedProject;
  }

  isComparisonAvailable(project: ProjectItem): boolean {
    return (
      [ProjectStatusNames.READY, ProjectStatusNames.ARCHIVED].includes(project.status.name) &&
      !!project.execInfo?.throughput
    );
  }
}
