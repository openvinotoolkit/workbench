import { createAction, props } from '@ngrx/store';

export const addUploadingArtifactId = createAction('[Globals] Add Uploading Artifact Id', props<{ id: number }>());
export const removeUploadingArtifactId = createAction(
  '[Globals] Remove Uploading Artifact Id',
  props<{ id: number }>()
);
