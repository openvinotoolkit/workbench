import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';

import { ErrorState } from '@store/state';

import { IInt8CalibrationPipeline } from '@shared/models/pipelines/int8-calibration-pipeline';

import { ProjectItem } from './project.model';

function getFullItemPath(item: ProjectItem, separator: string = '/') {
  return [...item.pathFromRoot, item.id].join(separator);
}

export const projectAdapter: EntityAdapter<ProjectItem> = createEntityAdapter<ProjectItem>({
  selectId: (model) => model.id,
  sortComparer: (a: ProjectItem, b: ProjectItem): number => getFullItemPath(a).localeCompare(getFullItemPath(b)),
});

export const int8CalibrationPipelineAdapter = createEntityAdapter<IInt8CalibrationPipeline>({
  selectId: (pipeline) => pipeline.id,
  sortComparer: (a, b): number => a.id - b.id,
});

export interface State extends EntityState<ProjectItem> {
  selectedProject: number | null;
  runningInt8CalibrationPipelines: EntityState<IInt8CalibrationPipeline>;
  isLoading?: boolean;
  isReportGenerating?: boolean;
  isDeploymentArchivePreparing?: boolean;
  isExportRunning?: boolean;
  error?: ErrorState;
}

export const initialState: State = projectAdapter.getInitialState({
  selectedProject: null,
  runningInt8CalibrationPipelines: int8CalibrationPipelineAdapter.getInitialState(),
  isLoading: false,
  isDeploymentArchivePreparing: false,
  isReportGenerating: false,
  isExportRunning: false,
  error: null,
});
