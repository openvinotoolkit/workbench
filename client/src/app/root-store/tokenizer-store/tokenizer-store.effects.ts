import { Injectable } from '@angular/core';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, filter, map, mergeMap, switchMap, takeUntil, tap } from 'rxjs/operators';
import { Action, Store } from '@ngrx/store';
import { from, of } from 'rxjs';

import { TokenizerService } from '@core/services/api/rest/tokenizer.service';
import { UploadFileService } from '@core/services/api/rest/upload-file.service';
import { GoogleAnalyticsService } from '@core/services/common/google-analytics.service';

import { ModelStoreActions, RootStoreState, UploadingArtifactsActions } from '@store';
import { ProjectStatusNames } from '@store/project-store/project.model';

import { TokenizerType } from '@shared/models/tokenizer/tokenizer';

import * as TokenizerActions from './tokenizer-store.actions';

@Injectable()
export class TokenizerEffects {
  upload$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TokenizerActions.startUpload),
      switchMap(({ modelId, tokenizer, redirect }) =>
        this.tokenizerService.create$(modelId, tokenizer).pipe(
          mergeMap((response) => {
            const actions: Action[] = [
              TokenizerActions.startUploadSuccess({ tokenizer: response.tokenizer }),
              UploadingArtifactsActions.addUploadingArtifactId({ id: response.tokenizer.id }),
              TokenizerActions.uploadTokenizerFile({
                tokenizerId: response.tokenizer.id,
                file: tokenizer.vocabFile,
                fileId: response.fileIds.vocabFile,
              }),
            ];

            if (tokenizer.type === TokenizerType.BPE) {
              actions.push(
                TokenizerActions.uploadTokenizerFile({
                  tokenizerId: response.tokenizer.id,
                  file: tokenizer.mergesFile,
                  fileId: response.fileIds.mergesFile,
                })
              );
            }

            return actions;
          }),
          catchError((error) => of(TokenizerActions.startUploadFailure({ error }))),
          tap(() => redirect())
        )
      )
    )
  );

  uploadFile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TokenizerActions.uploadTokenizerFile),
      mergeMap(({ tokenizerId, file, fileId }) =>
        from(this.uploadFileService.recursiveUploadTokenizerFile(tokenizerId, file, fileId)).pipe(
          map(() => TokenizerActions.uploadTokenizerFileSuccess()),

          catchError((error) => of(TokenizerActions.uploadTokenizerFileFailure({ tokenizerId, error }))),
          takeUntil(
            this.actions$.pipe(
              ofType(TokenizerActions.cancelUploadSuccess),
              filter((action) => action.tokenizerId === tokenizerId)
            )
          )
        )
      )
    )
  );

  uploadProgress$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TokenizerActions.uploadProgress),
      filter(({ tokenizer }) => tokenizer.status.name !== ProjectStatusNames.RUNNING),
      map(({ tokenizer }) => UploadingArtifactsActions.removeUploadingArtifactId({ id: tokenizer.id }))
    )
  );

  emitGaUpload$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(TokenizerActions.uploadProgress),
        filter(({ tokenizer }) => tokenizer.status.name === ProjectStatusNames.READY),
        map(({ tokenizer }) => this.gaService.emitUploadTokenizer(tokenizer))
      ),
    { dispatch: false }
  );

  cancelUploadArtifact$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TokenizerActions.cancelUpload, TokenizerActions.uploadTokenizerFileFailure),
      map(({ tokenizerId }) => UploadingArtifactsActions.removeUploadingArtifactId({ id: tokenizerId }))
    )
  );

  cancelUpload$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TokenizerActions.cancelUpload),
      mergeMap(({ tokenizerId }) =>
        this.tokenizerService.cancelUpload$(tokenizerId).pipe(
          map(() => TokenizerActions.cancelUploadSuccess({ tokenizerId })),
          catchError((error) => of(TokenizerActions.cancelUploadFailure({ error })))
        )
      )
    )
  );

  load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TokenizerActions.load),
      switchMap(({ modelId }) =>
        this.tokenizerService.load$(modelId).pipe(
          map((tokenizers) => TokenizerActions.loadSuccess({ data: tokenizers })),
          catchError((error) => of(TokenizerActions.loadFailure({ error })))
        )
      )
    )
  );

  get$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TokenizerActions.loadTokenizer),
      switchMap(({ modelId, tokenizerId }) =>
        this.tokenizerService.get$(modelId, tokenizerId).pipe(
          map((tokenizer) => TokenizerActions.loadTokenizerSuccess({ tokenizer })),
          catchError((error) => of(TokenizerActions.loadTokenizerFailure({ error })))
        )
      )
    )
  );

  remove$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TokenizerActions.remove),
      switchMap(({ modelId, tokenizerId }) =>
        this.tokenizerService.remove$(modelId, tokenizerId).pipe(
          mergeMap(() => [
            TokenizerActions.removeSuccess({ tokenizerId }),
            // update model list if selected tokenizer was removed
            ModelStoreActions.loadModelById({ id: modelId }),
            ModelStoreActions.refreshSelectedModel(),
          ]),
          catchError((error) => of(TokenizerActions.removeFailure({ error, tokenizerId })))
        )
      )
    )
  );

  select$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TokenizerActions.select),
      switchMap(({ modelId, tokenizerId }) =>
        this.tokenizerService.select$(modelId, tokenizerId).pipe(
          switchMap(() => this.tokenizerService.load$(modelId)),
          mergeMap((tokenizers) => [
            TokenizerActions.selectSuccess({ tokenizers }),
            // update model list with new selected tokenizer
            ModelStoreActions.loadModelById({ id: modelId }),
            ModelStoreActions.refreshSelectedModel(),
          ]),
          catchError((error) => of(TokenizerActions.selectFailure({ error })))
        )
      )
    )
  );

  constructor(
    private actions$: Actions,
    private store$: Store<RootStoreState.State>,
    private tokenizerService: TokenizerService,
    private uploadFileService: UploadFileService,
    private gaService: GoogleAnalyticsService
  ) {}
}
