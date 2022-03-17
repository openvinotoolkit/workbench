import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';

import { ErrorState } from '@store/state';

import { TargetMachineItem } from '@shared/models/pipelines/target-machines/target-machine';

export const targetMachineItemAdapter: EntityAdapter<TargetMachineItem> = createEntityAdapter<TargetMachineItem>({
  selectId: (targetMachine) => targetMachine.targetId,
  sortComparer: (a: TargetMachineItem, b: TargetMachineItem): number => a.targetId - b.targetId,
});

export interface State extends EntityState<TargetMachineItem> {
  selectedTarget: number;
  isLoading: boolean;
  error?: ErrorState;
}

export const initialState: State = targetMachineItemAdapter.getInitialState({
  selectedTarget: null,
  isLoading: false,
  error: null,
});
