import { Action, createReducer, on } from '@ngrx/store';

import * as TargetMachineActions from '@store/target-machine-store/target-machine.actions';
import { initialState, targetMachineItemAdapter } from '@store/target-machine-store/target-machine.state';
import { State } from '@store/target-machine-store/target-machine.state';

export const targetMachineStoreFeatureKey = 'targetMachine';

const targetMachineStoreReducer = createReducer(
  initialState,
  on(TargetMachineActions.loadTargetMachines, (state) => ({
    ...state,
    isLoading: true,
  })),
  on(TargetMachineActions.loadTargetMachinesSuccess, (state, { targetMachines }) =>
    targetMachineItemAdapter.setAll(targetMachines, {
      ...state,
      isLoading: false,
    })
  ),
  on(TargetMachineActions.loadTargetMachinesFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
  })),
  on(TargetMachineActions.addTargetMachineSuccess, (state, { targetMachine }) =>
    targetMachineItemAdapter.addOne(targetMachine, { ...state })
  ),
  on(TargetMachineActions.addTargetMachineFailure, (state, { error }) => ({
    ...state,
    error,
  })),
  on(TargetMachineActions.editTargetMachineSuccess, (state, { targetMachine }) =>
    targetMachineItemAdapter.upsertOne(targetMachine, { ...state })
  ),
  on(TargetMachineActions.editTargetMachineFailure, (state, { error }) => ({
    ...state,
    error,
  })),
  on(TargetMachineActions.removeTargetMachineSuccess, (state, { targetId }) =>
    targetMachineItemAdapter.removeOne(targetId, { ...state })
  ),
  on(TargetMachineActions.removeTargetMachineFailure, (state, { error }) => ({
    ...state,
    error,
  })),
  on(TargetMachineActions.targetMachineSelected, (state, { selectedTarget }) => ({
    ...state,
    selectedTarget,
  })),
  on(TargetMachineActions.loadTargetMachine, (state) => ({
    ...state,
    isLoading: true,
  })),
  on(TargetMachineActions.loadTargetMachineSuccess, (state, { targetMachine }) =>
    targetMachineItemAdapter.upsertOne(targetMachine, { ...state })
  ),
  on(TargetMachineActions.loadTargetMachineFailure, (state, { error }) => ({
    ...state,
    error,
  })),
  on(TargetMachineActions.updateTargetMachineStatus, (state, { targetId, status }) =>
    targetMachineItemAdapter.updateOne(
      {
        id: targetId,
        changes: {
          lastConnectionStatus: status,
        },
      },
      { ...state }
    )
  )
);

export function reducer(state: State | undefined, action: Action) {
  return targetMachineStoreReducer(state, action);
}
