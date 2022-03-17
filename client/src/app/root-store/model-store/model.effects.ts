import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Dictionary, Update } from '@ngrx/entity';
import { catchError, concatMap, filter, map, mergeMap, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { of } from 'rxjs';
import { isArray, isNil, map as _map, mapValues, negate, pickBy } from 'lodash';
import { Action, select, Store } from '@ngrx/store';
import { saveAs } from 'file-saver';

import { ModelsService } from '@core/services/api/rest/models.service';
import { CommonRestService } from '@core/services/api/rest/common-rest.service';
import { AccuracyRestService } from '@core/services/api/rest/accuracy.service';
import { HuggingfaceService } from '@core/services/api/rest/huggingface.service';

import * as GlobalsStoreSelectors from '@store/globals-store/globals.selectors';

import { ModelDownloaderDTO } from '@shared/models/dto/model-downloader-dto';
import { JobType } from '@shared/models/pipelines/pipeline';

import * as ModelStoreActions from './model.actions';
import { CreatedModelDTO, FileInfo, ModelItem, ModelSources } from './model.model';
import { RootStoreState } from '../index';
import * as ModelStoreSelectors from './model.selectors';
import { selectModelById } from './model.selectors';
import { ProjectStatusNames } from '../project-store/project.model';

@Injectable()
export class ModelEffects {
  archiveModel$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ModelStoreActions.startModelArchiving),
      withLatestFrom(this.store$.select<string>(GlobalsStoreSelectors.selectTabId)),
      switchMap(([{ modelId, isDerivative, name }, tabId]) => {
        return this.modelsService.downloadModel$(modelId, name, tabId).pipe(
          map(({ jobId, message, artifactId }) => {
            if (jobId === null && message) {
              return ModelStoreActions.startModelDownload({ artifactId, modelId, name });
            }
            return ModelStoreActions.waitDownload();
          })
        );
      })
    )
  );

  downloadModel$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ModelStoreActions.startModelDownload),
      switchMap(({ artifactId, modelId, name }) => {
        const path = `${artifactId}.tar.gz`;
        return this.commonRestService.downloadFile$(path).pipe(
          map((res) => {
            saveAs(res.body, name);
            return ModelStoreActions.startModelDownloadSuccess({ modelId });
          })
        );
      })
    )
  );

  archivingSocket$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ModelStoreActions.startModelArchivingSocket),
      withLatestFrom(this.store$.select<string>(GlobalsStoreSelectors.selectTabId)),
      filter(([{ tabId }, socketTabId]) => tabId === socketTabId),
      map(([{ status, artifactId, modelId, path, name }]) => {
        if (status.progress === 100) {
          return ModelStoreActions.startModelDownload({ artifactId, modelId, name });
        }
        return ModelStoreActions.waitDownload();
      })
    )
  );

  loadModels$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ModelStoreActions.loadModels),
      switchMap(() =>
        this.modelsService.getAllModelsList$().pipe(
          map((data: ModelItem[]) => ModelStoreActions.loadModelsSuccess({ items: data })),
          catchError((error) => of(ModelStoreActions.loadModelsFailure({ error })))
        )
      )
    )
  );

  loadModelById$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ModelStoreActions.loadModelById),
      mergeMap(({ id }) =>
        this.modelsService.getModel$(id).pipe(
          map((modelItem: ModelItem) => ModelStoreActions.loadModelByIdSuccess({ modelItem })),
          catchError((error) => of(ModelStoreActions.loadModelByIdFailure({ error })))
        )
      )
    )
  );

  loadSelectedModelById$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ModelStoreActions.loadSelectedModelById),
      mergeMap(({ id }) =>
        this.modelsService.getModel$(id).pipe(
          map((modelItem: ModelItem) => ModelStoreActions.loadSelectedModelByIdSuccess({ modelItem })),
          catchError((error) => of(ModelStoreActions.loadSelectedModelByIdFailure({ error })))
        )
      )
    )
  );

  refreshSelectedModel$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ModelStoreActions.refreshSelectedModel),
      withLatestFrom(this.store$.select(ModelStoreSelectors.selectSelectedProjectModel)),
      filter(([_, selectedModel]) => !!selectedModel),
      map(([_, { id }]) => ModelStoreActions.loadSelectedModelById({ id }))
    )
  );

  uploadModel$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ModelStoreActions.startUploadModel),
      switchMap(({ uploadingModel }) => {
        const files = uploadingModel.files as Dictionary<File | File[]>;
        uploadingModel.files = mapValues(files, (item) =>
          isArray(item) ? item.map((i) => new FileInfo(i)) : new FileInfo(item)
        );
        return this.modelsService.uploadModel$(uploadingModel).pipe(
          mergeMap((createdModel: CreatedModelDTO) => {
            return _map(createdModel.files, (fileId, fileKey) => {
              const filesForKey = files[fileKey];
              if (!isArray(fileId) && !isArray(filesForKey)) {
                return ModelStoreActions.startUploadModelSuccess({
                  modelItem: createdModel.modelItem,
                  fileId,
                  file: filesForKey,
                });
              }

              return (fileId as number[]).map((id, index) =>
                ModelStoreActions.startUploadModelSuccess({
                  modelItem: createdModel.modelItem,
                  fileId: id,
                  file: filesForKey[index],
                })
              );
            }).flat();
          }),
          catchError((error) => of(ModelStoreActions.startUploadModelFailure({ error })))
        );
      })
    )
  );

  uploadModelDir$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ModelStoreActions.startUploadModelDir),
      switchMap(({ modelFolder }) => {
        const { savedModelDir } = modelFolder.files;
        const { assets, variables, pbModel, size } = savedModelDir;
        const files = [...assets, ...variables, pbModel].reduce((acc, file: File, _) => {
          acc[file.name] = file;
          return acc;
        }, {});

        modelFolder.files.savedModelDir.assets = _map(assets, (file: File) => new FileInfo(file));
        modelFolder.files.savedModelDir.variables = _map(variables, (file: File) => new FileInfo(file));
        modelFolder.files.savedModelDir.pbModel = new FileInfo(pbModel as File);
        modelFolder.files.savedModelDir.size = size;
        return this.modelsService.uploadModel$(modelFolder).pipe(
          mergeMap((createdModel: CreatedModelDTO) =>
            _map(createdModel.files, (fileId: number, fileKey: string) => {
              return ModelStoreActions.startUploadModelSuccess({
                modelItem: createdModel.modelItem,
                fileId,
                file: files[fileKey],
              });
            })
          ),
          catchError((error) => of(ModelStoreActions.startUploadModelFailure({ error })))
        );
      })
    )
  );

  uploadModelSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ModelStoreActions.startUploadModelSuccess),
      mergeMap(({ modelItem, fileId, file }) =>
        this.modelsService.recursiveUpload$(modelItem.id, file, fileId).pipe(
          map(() => ModelStoreActions.uploadModelSuccess({ id: modelItem.id })),
          catchError((error) => of(ModelStoreActions.uploadModelFailure({ id: modelItem.id, error })))
        )
      )
    )
  );

  convertModel$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ModelStoreActions.convertModel),
      mergeMap(({ convertConfig }) =>
        this.modelsService.convertModel$(convertConfig).pipe(
          map(() => ModelStoreActions.convertModelSuccess()),
          catchError((error) => of(ModelStoreActions.convertModelFailure({ error })))
        )
      )
    )
  );

  editModelConvert$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ModelStoreActions.editModelConvert),
      mergeMap(({ editConvertConfig }) =>
        this.modelsService.editModelConvert$(editConvertConfig).pipe(
          map(({ irId }) => ModelStoreActions.editModelConvertSuccess({ modelId: irId })),
          catchError((error) => of(ModelStoreActions.editModelConvertFailure({ error })))
        )
      )
    )
  );

  editModelConvertSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ModelStoreActions.editModelConvertSuccess),
      map(({ modelId }) => {
        const modelItemUpdate: Update<ModelItem> = {
          id: modelId,
          changes: {
            status: {
              name: ProjectStatusNames.QUEUED,
              progress: 0,
            },
          },
        };
        return ModelStoreActions.updateModelItem(modelItemUpdate);
      })
    )
  );

  deleteModel$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ModelStoreActions.removeModel),
      switchMap(({ id }) =>
        this.modelsService.removeModel$(id).pipe(
          map((res: { id: number }) => ModelStoreActions.removeModelSuccess({ id: res.id })),
          catchError((error) => of(ModelStoreActions.removeModelFailure({ error })))
        )
      )
    )
  );

  cancelModelUpload$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ModelStoreActions.cancelModelUpload),
      switchMap(({ id }) =>
        this.modelsService.cancelModelUploading$(id).pipe(
          map((res: { id: number }) => ModelStoreActions.cancelModelUploadSuccess({ id: Number(res.id) })),
          catchError((error) => of(ModelStoreActions.cancelModelUploadFailure({ error })))
        )
      )
    )
  );

  loadOMZModels$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ModelStoreActions.loadOMZModels),
      mergeMap(() =>
        this.modelsService.getModelsToDownload$().pipe(
          map((items: ModelDownloaderDTO[]) => ModelStoreActions.loadOMZModelsSuccess({ items })),
          catchError((error) => of(ModelStoreActions.loadOMZModelsFailure({ error })))
        )
      )
    )
  );

  downloadOMZModel$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ModelStoreActions.downloadOMZModel),
      switchMap(({ model, precision }) =>
        this.modelsService.downloadOMZModel$(model.name, precision).pipe(
          map((modelItem: ModelItem) => ModelStoreActions.downloadOMZModelSuccess({ modelItem })),
          catchError((error) => of(ModelStoreActions.downloadOMZModelFailure({ error })))
        )
      )
    )
  );

  importHuggingfaceModel$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ModelStoreActions.importHuggingfaceModel),
      switchMap(({ huggingface_model_id }) =>
        this._hfService.importModel$(huggingface_model_id).pipe(
          map((model: ModelItem) => ModelStoreActions.importHuggingfaceModelSuccess({ model })),
          catchError((error) => of(ModelStoreActions.importHuggingfaceModelFailure({ error })))
        )
      )
    )
  );

  resetImportingModelForIRModel$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ModelStoreActions.downloadOMZModelSuccess),
      filter(({ modelItem }) => modelItem.modelSource === ModelSources.IR),
      map(() => ModelStoreActions.resetImportingModel())
    )
  );

  updateModelItemOnSocket$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ModelStoreActions.onUploadModelSocket),
      //  get item by id
      mergeMap(({ data }) => of(data).pipe(withLatestFrom(this.store$.pipe(select(selectModelById, data.id))))),
      filter(([_, modelItem]) => modelItem && ![ProjectStatusNames.CANCELLED].includes(modelItem.status.name)),
      map(([payload]) => {
        const { id, ...modelItemChanges } = payload;
        const modelItemUpdate: Update<ModelItem> = {
          id,
          changes: pickBy(modelItemChanges, negate(isNil)),
        };
        return ModelStoreActions.updateModelItem(modelItemUpdate);
      })
    )
  );

  updateAccuracyConfig$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ModelStoreActions.updateAccuracyConfig),
      mergeMap(({ modelId, projectId, data, deleteRawAccuracy, onSuccess }) =>
        this.modelsService.setAccuracyConfig$(modelId, data).pipe(
          switchMap((modelItem) =>
            (deleteRawAccuracy ? this.accuracyRestService.deleteRawConfig$(projectId) : of(null)).pipe(
              map(() => ModelStoreActions.updateAccuracyConfigSuccess({ modelItem, onSuccess }))
            )
          ),
          catchError((error) => of(ModelStoreActions.updateAccuracyConfigFailure({ error })))
        )
      )
    )
  );

  updateAccuracyConfigSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ModelStoreActions.updateAccuracyConfigSuccess),
        tap(({ onSuccess }) => onSuccess?.())
      ),
    { dispatch: false }
  );

  configureModel$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ModelStoreActions.configureModel),
      mergeMap(({ modelId, inputsConfigurations }) =>
        this.modelsService.configureModel$(modelId, inputsConfigurations).pipe(
          map(() => ModelStoreActions.configureModelStartSuccess()),
          catchError((error) => of(ModelStoreActions.configureModelStartFailure({ error })))
        )
      )
    )
  );

  onConfigureSocketMessage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ModelStoreActions.onConfigureModelSocketMessage),
      concatMap(({ message }) => {
        if ([ProjectStatusNames.RUNNING, ProjectStatusNames.QUEUED].includes(message.status.name)) {
          return [ModelStoreActions.setConfigurePipeline({ data: message })];
        }

        const actions: Action[] = [];

        if (
          ProjectStatusNames.READY === message.status.name &&
          !message.jobs.filter(({ status }) => status.name !== ProjectStatusNames.READY).length
        ) {
          const jobWithModelId = message.jobs.find(({ type }) => type === JobType.apply_model_layout_job);

          if (jobWithModelId?.modelId) {
            const modelId = jobWithModelId.modelId;

            actions.push(
              ModelStoreActions.configureModelSuccess({ modelId }),
              ModelStoreActions.loadModelById({ id: modelId })
            );
          }
        }

        if (ProjectStatusNames.ERROR === message.status.name) {
          actions.push(ModelStoreActions.configureFailure({ error: message.status.errorMessage }));
        }

        return [...actions, ModelStoreActions.removeConfigurePipeline()];
      })
    )
  );

  onConfigureModelSuccess = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ModelStoreActions.configureModelSuccess),
        tap(() => this.router.navigate(['/projects/create']))
      ),
    { dispatch: false }
  );

  constructor(
    private actions$: Actions,
    private modelsService: ModelsService,
    private store$: Store<RootStoreState.State>,
    private router: Router,
    private commonRestService: CommonRestService,
    private accuracyRestService: AccuracyRestService,
    private _hfService: HuggingfaceService
  ) {}
}
