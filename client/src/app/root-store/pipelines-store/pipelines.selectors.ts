import { createFeatureSelector, createSelector } from '@ngrx/store';
import { Dictionary } from '@ngrx/entity';
import { cloneDeep, findLast, partition } from 'lodash';

import { State as AppState } from '@store/state';
import { pipelineItemAdapter, State as PipelinesState } from '@store/pipelines-store/pipelines.state';
import { ProjectStatus } from '@store/project-store/project.model';
import { TargetMachineSelectors } from '@store/target-machine-store';

import {
  ConfigureTargetPipelineType,
  IConfigureTargetPipeline,
  PingTargetPipeline,
  SetupTargetPipeline,
  SetupTargetPipelineStage,
  SetupTargetPipelineStagesEnum,
} from '@shared/models/pipelines/target-machines/configure-target-pipeline';

import * as fromPipelinesStore from './pipelines.reducer';

const selectPipelinesState = createFeatureSelector<PipelinesState>(fromPipelinesStore.pipelinesStoreFeatureKey);

export const selectPipelineEntities: (state: AppState) => Dictionary<IConfigureTargetPipeline> =
  pipelineItemAdapter.getSelectors(selectPipelinesState).selectEntities;

export const selectAllPipelines: (state: AppState) => IConfigureTargetPipeline[] =
  pipelineItemAdapter.getSelectors(selectPipelinesState).selectAll;

const filterPipelinesByTargetId = (pipelines: IConfigureTargetPipeline[], targetId: number) =>
  pipelines.filter(({ targetId: pipelineTargetId }) => targetId === pipelineTargetId);

export const selectPipelinesForTarget = createSelector(selectAllPipelines, filterPipelinesByTargetId);

export const selectPipelinesForSelectedTarget = createSelector(
  selectAllPipelines,
  TargetMachineSelectors.selectSelectedTargetMachineId,
  filterPipelinesByTargetId
);

export const selectSetupTargetPipeline = createSelector(
  selectPipelinesForSelectedTarget,
  (pipelines) => findLast(pipelines, ({ type }) => type === ConfigureTargetPipelineType.SETUP) as SetupTargetPipeline
);

export const selectPingTargetPipeline = createSelector(
  selectPipelinesForSelectedTarget,
  (pipelines) => findLast(pipelines, ({ type }) => type === ConfigureTargetPipelineType.PING) as PingTargetPipeline
);

export const selectConfigurationStages = createSelector(selectSetupTargetPipeline, (setupPipeline) => {
  if (!setupPipeline) {
    return [];
  }
  const [prepareAssetsStages, restStages] = partition(setupPipeline.stages, [
    'stage',
    SetupTargetPipelineStagesEnum.PREPARING_SETUP_ASSETS,
  ]);
  const mergedPrepareAssetsStage = mergePrepareAssetsLogsAndStatus(prepareAssetsStages);
  return [mergedPrepareAssetsStage, ...restStages];
});

export const selectConnectionStages = createSelector(selectPingTargetPipeline, (pingPipeline) =>
  pingPipeline ? pingPipeline.stages : []
);

function mergePrepareAssetsLogsAndStatus(prepareAssetsStages: SetupTargetPipelineStage[]): SetupTargetPipelineStage {
  let res = cloneDeep(prepareAssetsStages[0]);
  let logs = '';
  prepareAssetsStages.forEach((stage) => {
    if (stage.logs) {
      logs += '\n' + stage.logs;
    }
    if (ProjectStatus.priority[stage.status] > ProjectStatus.priority[res.status]) {
      res = cloneDeep(stage);
    }
  });
  res.logs = logs;
  return res;
}
