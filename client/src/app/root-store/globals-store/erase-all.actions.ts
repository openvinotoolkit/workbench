import { createAction, props } from '@ngrx/store';

import { ErrorState } from '@store/state';

export const eraseAll = createAction('[Globals] Erase All');

export const eraseAllSuccess = createAction('[Globals] Erase All Success');

export const eraseAllFailure = createAction('[Globals] Erase All Failure', props<{ error: ErrorState }>());
