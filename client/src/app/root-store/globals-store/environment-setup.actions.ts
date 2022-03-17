import { createAction, props } from '@ngrx/store';

import { ErrorState } from '@store/state';

export const stop = createAction('[Globals] Stop');

export const stopSuccess = createAction('[Globals] Stop Success');

export const stopFailure = createAction('[Globals] Stop Failure', props<{ error: ErrorState }>());
