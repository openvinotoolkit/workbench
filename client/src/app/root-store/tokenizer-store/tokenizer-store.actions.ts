import { createAction, props } from '@ngrx/store';

import { ErrorState } from '@store/state';

import { ITokenizer } from '@shared/models/tokenizer/tokenizer';

import { ITokenizerDTO } from '../../modules/model/pages/import-tokenizer-page/tokenizer-dto.model';

const prefix = '[Tokenizer]';

// UPLOAD

export const startUpload = createAction(
  `${prefix} Start Upload`,
  props<{ modelId: number; tokenizer: ITokenizerDTO; redirect: () => void }>()
);

export const startUploadSuccess = createAction(`${prefix} Start Upload Success`, props<{ tokenizer: ITokenizer }>());

export const startUploadFailure = createAction(`${prefix} Start Upload Failure`, props<{ error: ErrorState }>());

export const uploadProgress = createAction(`${prefix} Upload Progress`, props<{ tokenizer: ITokenizer }>());

export const uploadTokenizerFile = createAction(
  `${prefix} Upload Tokenizer File`,
  props<{ tokenizerId: number; fileId: number; file: File }>()
);

export const uploadTokenizerFileSuccess = createAction(`${prefix} Upload File Success`);
export const uploadTokenizerFileFailure = createAction(
  `${prefix} Upload Tokenizer File Failure`,
  props<{ tokenizerId: number; error: ErrorState }>()
);

export const cancelUpload = createAction(`${prefix} Cancel Upload`, props<{ tokenizerId: number }>());
export const cancelUploadSuccess = createAction(`${prefix} Cancel Upload Success`, props<{ tokenizerId: number }>());
export const cancelUploadFailure = createAction(`${prefix} Cancel Upload Failure`, props<{ error: ErrorState }>());

// LOADING

export const load = createAction(`${prefix} Load List`, props<{ modelId: number }>());
export const loadSuccess = createAction(`${prefix} Load List Success`, props<{ data: ITokenizer[] }>());
export const loadFailure = createAction(`${prefix} Load List Failure`, props<{ error: ErrorState }>());

// SELECTION

export const select = createAction(
  `${prefix} Select Tokenizer for Model`,
  props<{ modelId: number; tokenizerId: number }>()
);
export const selectSuccess = createAction(
  `${prefix} Select Tokenizer for Model Success`,
  props<{ tokenizers: ITokenizer[] }>()
);
export const selectFailure = createAction(
  `${prefix} Select Tokenizer for Model Failure`,
  props<{ error: ErrorState }>()
);

// REMOVE

export const remove = createAction(`${prefix} Remove`, props<{ modelId: number; tokenizerId: number }>());
export const removeSuccess = createAction(`${prefix} Remove Success`, props<{ tokenizerId: number }>());
export const removeFailure = createAction(
  `${prefix} Remove Failure`,
  props<{ tokenizerId: number; error: ErrorState }>()
);

// LOAD TOKENIZER

export const loadTokenizer = createAction(
  `${prefix} Load Tokenizer`,
  props<{ modelId: number; tokenizerId: number }>()
);
export const loadTokenizerSuccess = createAction(
  `${prefix} Load Tokenizer Success`,
  props<{ tokenizer: ITokenizer }>()
);
export const loadTokenizerFailure = createAction(`${prefix} Load Tokenizer Failure`, props<{ error: ErrorState }>());

// RESET
export const reset = createAction(`${prefix} Reset`);
