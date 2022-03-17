import { createAction, props } from '@ngrx/store';

import { AuthErrorDTO } from '@shared/models/jwt';

export const loginAction = createAction('[Auth] Login', props<{ token: string; viaUrl?: boolean }>());

export const loginSuccessAction = createAction('[Auth] Login Success', props<{ accessToken: string }>());

export const loginFailureAction = createAction('[Auth] Login Failure', props<{ error: AuthErrorDTO }>());

export const refreshTokenAction = createAction('[Auth] Refresh Token');
export const refreshTokenSuccessAction = createAction('[Auth] Refresh Token Success', props<{ accessToken: string }>());
export const refreshTokenFailureAction = createAction('[Auth] Refresh Token Failure', props<{ error: AuthErrorDTO }>());

export const logoutAction = createAction('[Auth] Logout');
export const logoutSuccessAction = createAction('[Auth] Logout Success', props<{ logout: boolean }>());
export const logoutFailureAction = createAction('[Auth] Logout Failure', props<{ error: AuthErrorDTO }>());

export const resetCredentialsAction = createAction('[Auth] Reset Credentials');
