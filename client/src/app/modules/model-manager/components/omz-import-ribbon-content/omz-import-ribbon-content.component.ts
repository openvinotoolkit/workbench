import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Store } from '@ngrx/store';
import { takeUntil } from 'rxjs/operators';

import {
  modelFrameworkNamesMap,
  ModelFrameworks,
  ModelPrecisionEnum,
  TaskTypeToNameMap,
} from '@store/model-store/model.model';
import { GlobalsStoreActions, ModelStoreActions, ModelStoreSelectors, RootStoreState } from '@store';

import { ModelDownloaderDTO } from '@shared/models/dto/model-downloader-dto';
import {
  IOpenModelZooFilter,
  OpenModelZooDataSource,
} from '@shared/models/model-zoo-data-source/open-model-zoo-data-source';

import { BaseModelZooImportComponent } from '../base-model-zoo-import/base-model-zoo-import.component';

@Component({
  selector: 'wb-omz-import-ribbon-content',
  templateUrl: './omz-import-ribbon-content.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OmzImportRibbonContentComponent extends BaseModelZooImportComponent<
  ModelDownloaderDTO,
  IOpenModelZooFilter
> {
  readonly dataSource = new OpenModelZooDataSource();

  readonly ModelTaskTypeToNameMap = TaskTypeToNameMap;
  readonly modelFrameworkNamesMap = modelFrameworkNamesMap;
  readonly modelFrameworkIconsMap = {
    [ModelFrameworks.OPENVINO]: 'openvino',
    [ModelFrameworks.CAFFE]: 'caffe',
    [ModelFrameworks.CAFFE2]: 'caffe',
    [ModelFrameworks.TF]: 'tensorflow',
    [ModelFrameworks.MXNET]: 'mxnet',
    [ModelFrameworks.ONNX]: 'onnx',
    [ModelFrameworks.PYTORCH]: 'pytorch',
  };

  private readonly _omzModels$ = this._store$.select(ModelStoreSelectors.selectOMZModels);
  readonly isLoading$ = this._store$.select(ModelStoreSelectors.selectOMZModelsAreLoading);
  readonly error$ = this._store$.select(ModelStoreSelectors.selectOMZModelsError);

  constructor(private readonly _store$: Store<RootStoreState.State>) {
    super();
    this._populateSortOptions();
    this._disableControlsOnLoading();

    this._omzModels$.pipe(takeUntil(this._unsubscribe$)).subscribe((models) => {
      this.dataSource.data = models;
    });

    this._triggerModelsLoading();
  }

  protected get _dataSourceFilter(): IOpenModelZooFilter {
    return {
      name: this.searchControl.value,
      filters: this.filtersControl?.value || {},
    };
  }

  protected _triggerModelsLoading(): void {
    this._store$.dispatch(ModelStoreActions.loadOMZModels());
    this._store$.dispatch(GlobalsStoreActions.getFrameworksAvailability());
  }

  importModel(): void {
    // TODO Check which precision is needed for initial downloading
    const precision =
      this.selectedModel.framework === ModelFrameworks.OPENVINO ? ModelPrecisionEnum.FP16 : ModelPrecisionEnum.FP32;
    this._store$.dispatch(
      ModelStoreActions.downloadOMZModel({
        model: this.selectedModel,
        precision,
      })
    );
  }
}
