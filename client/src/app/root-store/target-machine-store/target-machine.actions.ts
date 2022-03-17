import { createAction, props } from '@ngrx/store';

import {
  TargetMachineItem,
  TargetMachineStatusNameType,
} from '@shared/models/pipelines/target-machines/target-machine';

export const loadTargetMachines = createAction('[Target Machines] Load Target Machines');

export const loadTargetMachinesSuccess = createAction(
  '[Target Machines] Load Target Machines Success',
  props<{ targetMachines: TargetMachineItem[] }>()
);
export const loadTargetMachinesFailure = createAction(
  '[Target Machines] Load Target Machines Failure',
  props<{ error }>()
);

export const addTargetMachine = createAction(
  '[Target Machines] Add Target Machine',
  props<{ targetMachine: TargetMachineItem }>()
);

export const addTargetMachineSuccess = createAction(
  '[Target Machines] Add Target Machine Success',
  props<{ targetMachine: TargetMachineItem }>()
);

export const addTargetMachineFailure = createAction(
  '[Target Machines] Add Target Machine Failure',
  props<{ error; targetId?: number }>()
);

export const editTargetMachine = createAction(
  '[Target Machines] Edit Target Machine',
  props<{ targetMachine: TargetMachineItem }>()
);

export const editTargetMachineSuccess = createAction(
  '[Target Machines] Edit Target Machine Success',
  props<{ targetMachine: TargetMachineItem }>()
);

export const editTargetMachineFailure = createAction(
  '[Target Machines] Edit Target Machine Failure',
  props<{ error; targetId?: number }>()
);

export const removeTargetMachine = createAction(
  '[Target Machines] Delete Target Machine',
  props<{ targetMachineId: number }>()
);

export const removeTargetMachineSuccess = createAction(
  '[Target Machines] Delete Target Machine Success',
  props<{ targetId: number }>()
);

export const removeTargetMachineFailure = createAction(
  '[Target Machines] Delete Target Machine Failure',
  props<{ error }>()
);

export const targetMachineSelected = createAction(
  '[Target Machines] Select Target Machine',
  props<{ selectedTarget: number }>()
);

export const pingTargetMachine = createAction('[Target Machines] Ping Target Machine', props<{ targetId: number }>());

export const pingTargetMachineSuccess = createAction(
  '[Target Machines] Ping Target Machine Success',
  props<{ targetMachine: TargetMachineItem }>()
);

export const pingTargetMachineFailure = createAction(
  '[Target Machines] Ping Target Machine Failure',
  props<{ error }>()
);

export const loadTargetMachine = createAction('[Target Machines] Load Target Machine', props<{ targetId: number }>());

export const loadTargetMachineSuccess = createAction(
  '[Target Machines] Load Target Machine Success',
  props<{ targetMachine: TargetMachineItem }>()
);

export const loadTargetMachineFailure = createAction(
  '[Target Machines] Load Target Machine Failure',
  props<{ error }>()
);

export const updateTargetMachineStatus = createAction(
  '[Target Machines] Update Target Machine Status',
  props<{ targetId: number; status: TargetMachineStatusNameType }>()
);
