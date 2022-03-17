import { keys } from 'lodash';
import { Action } from '@ngrx/store';

import { reducer } from '@store/pipelines-store/pipelines.reducer';
import { initialState } from '@store/pipelines-store/pipelines.state';
import { PipelineActions, PipelinesReducer } from '@store';

import {
  ConfigureTargetPipelineType,
  IConfigureTargetPipeline,
  PingTargetPipelineStagesEnum,
  PipelineStageStatusNames,
  SetupTargetPipelineStagesEnum,
} from '@shared/models/pipelines/target-machines/configure-target-pipeline';
import { TargetMachineStatusNames } from '@shared/models/pipelines/target-machines/target-machine';

export const mockedPipelines: IConfigureTargetPipeline[] = [
  {
    id: 1,
    targetId: 1,
    type: ConfigureTargetPipelineType.SETUP,
    targetStatus: TargetMachineStatusNames.AVAILABLE,
    stages: [
      {
        jobId: 1,
        status: PipelineStageStatusNames.SUCCESS,
        stage: SetupTargetPipelineStagesEnum.PREPARING_SETUP_ASSETS,
        logs: '',
        errorMessage: null,
        warningMessage: null,
      },
      {
        jobId: 2,
        status: PipelineStageStatusNames.SUCCESS,
        stage: SetupTargetPipelineStagesEnum.UPLOADING_SETUP_ASSETS,
        logs: '',
        errorMessage: null,
        warningMessage: null,
      },
      {
        jobId: 3,
        status: PipelineStageStatusNames.SUCCESS,
        stage: SetupTargetPipelineStagesEnum.CONFIGURING_ENVIRONMENT,
        logs: '',
        errorMessage: null,
        warningMessage: null,
      },
    ],
    status: { name: PipelineStageStatusNames.SUCCESS },
  },
  {
    id: 2,
    targetId: 1,
    type: ConfigureTargetPipelineType.PING,
    targetStatus: TargetMachineStatusNames.AVAILABLE,
    stages: [
      {
        jobId: 4,
        status: PipelineStageStatusNames.SUCCESS,
        stage: PingTargetPipelineStagesEnum.COLLECTING_AVAILABLE_DEVICES,
        logs: '',
        errorMessage: null,
        warningMessage: null,
      },
      {
        jobId: 5,
        status: PipelineStageStatusNames.SUCCESS,
        stage: PingTargetPipelineStagesEnum.COLLECTING_SYSTEM_INFORMATION,
        logs: '',
        errorMessage: null,
        warningMessage: null,
      },
    ],
    status: { name: PipelineStageStatusNames.SUCCESS },
  },
];

describe('Pipelines Reducer', () => {
  describe('an unknown action', () => {
    it('should return the previous state', () => {
      const action = {} as Action;

      const result = reducer(initialState, action);

      expect(result).toBe(initialState);
    });
  });

  describe('Load pipelines action', () => {
    it('should set loading to true', () => {
      const action = PipelineActions.loadPipelineForTargetMachine({ targetMachineId: 1 });

      const state = PipelinesReducer(initialState, action);

      expect(state.isLoading).toEqual(true);
      expect(state.entities).toEqual({});
    });
  });

  describe('Load pipelines success action', () => {
    it('should set all items', () => {
      const action = PipelineActions.loadPipelineForTargetMachineSuccess({ pipelines: mockedPipelines });

      const loadAction = PipelineActions.loadPipelineForTargetMachine({ targetMachineId: 1 });
      const previousState = PipelinesReducer(initialState, loadAction);
      const state = PipelinesReducer(previousState, action);

      expect(keys(state.entities).length).toEqual(mockedPipelines.length);
      expect(state.ids.length).toEqual(mockedPipelines.length);

      expect(state.isLoading).toEqual(false);
    });
  });
});
