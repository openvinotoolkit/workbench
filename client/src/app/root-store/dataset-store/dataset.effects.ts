import { Injectable } from '@angular/core';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, filter, map, mergeMap, switchMap, withLatestFrom } from 'rxjs/operators';
import { of } from 'rxjs';
import { select, Store } from '@ngrx/store';
import { map as _map, mapValues } from 'lodash';

import { DatasetsService } from '@core/services/api/rest/datasets.service';

import * as DatasetActions from './dataset.actions';
import {
  cancelDatasetUploadSuccess,
  createNADatasetFailure,
  createNADatasetSuccess,
  loadDatasetsFailure,
  loadDatasetsSuccess,
  loadDefaultImagesFailure,
  loadDefaultImagesSuccess,
  removeDatasetFailure,
  removeDatasetSuccess,
  startUploadDatasetFailure,
  startUploadDatasetSuccess,
  updateDatasetUploadPercent,
  uploadDatasetFailure,
  uploadDatasetSuccess,
} from './dataset.actions';
import { DatasetItem } from './dataset.model';
import { cancelModelUploadFailure } from '../model-store/model.actions';
import { ProjectStatusNames } from '../project-store/project.model';
import { RootStoreState } from '../index';
import { selectDatasetById } from './dataset.selectors';
import { FileInfo } from '../model-store/model.model';

@Injectable()
export class DatasetEffects {
  loadDatasets$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DatasetActions.loadDatasets),
      switchMap(() =>
        this.datasetsService.getDatasetsList$().pipe(
          map((data: DatasetItem[]) => loadDatasetsSuccess({ items: data })),
          catchError((error) => of(loadDatasetsFailure({ error })))
        )
      )
    )
  );

  uploadDataset$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DatasetActions.startUploadDataset),
      switchMap(({ dataset }) => {
        const file = dataset.files.datasetArchive as File;
        dataset.files.datasetArchive = new FileInfo(file);
        return this.datasetsService.uploadDataset$(dataset).pipe(
          map(({ datasetItem, files }) =>
            startUploadDatasetSuccess({
              dataset: datasetItem,
              fileId: files.datasetArchive,
              file,
            })
          ),
          catchError((error) => of(startUploadDatasetFailure({ error })))
        );
      })
    )
  );

  uploadDatasetSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DatasetActions.startUploadDatasetSuccess, DatasetActions.createNADatasetSuccess),
      switchMap(({ dataset, fileId, file }) =>
        this.datasetsService.recursiveUpload$(Number(dataset.id), file, fileId).pipe(
          map(() => uploadDatasetSuccess({ id: Number(dataset.id) })),
          catchError((error) => of(uploadDatasetFailure({ id: Number(dataset.id), error })))
        )
      )
    )
  );

  removeDataset$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DatasetActions.removeDataset),
      switchMap(({ id }) =>
        this.datasetsService.removeDataset$(id).pipe(
          map((res: { id: number }) => removeDatasetSuccess({ id: res.id })),
          catchError((error) => of(removeDatasetFailure({ error })))
        )
      )
    )
  );

  cancelDatasetUpload$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DatasetActions.cancelDatasetUpload),
      switchMap(({ id }) =>
        this.datasetsService.cancelDatasetUploading$(id).pipe(
          map((res: { id: number }) => cancelDatasetUploadSuccess({ id: Number(res.id) })),
          catchError((error) => of(cancelModelUploadFailure({ error })))
        )
      )
    )
  );

  updateUploadStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DatasetActions.onUploadDatasetSocket),
      // get item by id
      mergeMap(({ data }) => of(data).pipe(withLatestFrom(this.store$.pipe(select(selectDatasetById, data.id))))),
      filter(([_, datasetItem]) => datasetItem && datasetItem.status.name !== ProjectStatusNames.CANCELLED),
      map(([payload]) => updateDatasetUploadPercent({ data: payload }))
    )
  );

  loadDefaultImage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DatasetActions.loadDefaultImages),
      switchMap(({ isDevCloud }) =>
        this.datasetsService.getDefaultImages$(isDevCloud).pipe(
          map((blobs) => loadDefaultImagesSuccess({ blobs })),
          catchError((error) => of(loadDefaultImagesFailure({ error })))
        )
      )
    )
  );

  createNADataset$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DatasetActions.createNADataset),
      switchMap(({ dataset }) => {
        const { datasetName, images, augmentationConfig } = dataset;
        const imageFiles = mapValues(images, (file: File) => new FileInfo(file));
        return this.datasetsService.createNADataset$(datasetName, imageFiles, augmentationConfig).pipe(
          mergeMap((createdDataset) =>
            _map(createdDataset.files, (fileId: number, fileKey: string) =>
              createNADatasetSuccess({
                dataset: createdDataset.datasetItem,
                fileId,
                file: images[fileKey],
              })
            )
          ),
          catchError((error) => of(createNADatasetFailure({ error })))
        );
      })
    )
  );

  constructor(
    private actions$: Actions,
    private datasetsService: DatasetsService,
    private store$: Store<RootStoreState.State>
  ) {}
}
