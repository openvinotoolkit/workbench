import { createAction, props } from '@ngrx/store';

import { ProjectStatus } from '@store/project-store/project.model';

export const startLogDownloadAction = createAction('[Download Log] Start Log Download');
export const startLogDownloadSuccess = createAction('[Download Log] Start Log Download Success');
export const startLogDownloadFailure = createAction('[Download Log] Start Log Download Failure');
export const logDownloadAction = createAction('[Download Log] Log Download', props<{ artifactId }>());
export const logDownloadSuccess = createAction('[Download Log] Log Download Success');
export const logDownloadFailure = createAction('[Download Log] Log Download Failure');
export const OnDownloadLogSocketAction = createAction(
  '[Download Log] On Log Download',
  props<{ artifactId: number; tabId: string; status: ProjectStatus }>()
);
