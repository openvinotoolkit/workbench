import { createSelector } from '@ngrx/store';

import { selectGlobalsState } from '@store/globals-store/globals.selectors';

export const selectUploadingArtifactIds = createSelector(selectGlobalsState, (state) => state.uploadingArtifactIds);
