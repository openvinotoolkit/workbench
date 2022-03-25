import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Store } from '@ngrx/store';
import { takeUntil } from 'rxjs/operators';

import { modelFrameworkNamesMap, ModelFrameworks, TaskTypeToNameMap } from '@store/model-store/model.model';
import { ModelStoreActions, ModelStoreSelectors, RootStoreState } from '@store';

import { ModelDownloaderDTO } from '@shared/models/dto/model-downloader-dto';
import {
  IOpenModelZooFilter,
  OpenModelZooDataSource,
} from '@shared/models/model-zoo-data-source/open-model-zoo-data-source';

import { OMZModelPrecisionEnum } from '../model-downloader-table/model-downloader-table.component';
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

  constructor(private readonly _store$: Store<RootStoreState.State>) {
    super();
    this._populateSortOptions();

    this._omzModels$.pipe(takeUntil(this._unsubscribe$)).subscribe((models) => {
      this.dataSource.data = models;
    });
  }

  protected get _dataSourceFilter(): IOpenModelZooFilter {
    return {
      name: this.searchControl.value,
      filters: this.filtersControl?.value || {},
    };
  }

  importModel(): void {
    // TODO Check which precision is needed for initial downloading
    const precision =
      this.selectedModel.framework === ModelFrameworks.OPENVINO
        ? OMZModelPrecisionEnum.FP16
        : OMZModelPrecisionEnum.FP32;
    this._store$.dispatch(
      ModelStoreActions.downloadOMZModel({
        model: this.selectedModel,
        precision,
      })
    );
  }
}
