import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Store } from '@ngrx/store';
import { takeUntil } from 'rxjs/operators';

import { MessagesService } from '@core/services/common/messages.service';

import {
  ModelDomain,
  modelFrameworkNamesMap,
  ModelFrameworks,
  TaskTypeToNameMap,
} from '@store/model-store/model.model';
import { GlobalsStoreSelectors, ModelStoreActions, ModelStoreSelectors, RootStoreState } from '@store';
import { FrameworksAvailabilityStates, IFrameworksAvailability } from '@store/globals-store/globals.state';

import { ModelDownloaderDTO } from '@shared/models/dto/model-downloader-dto';
import { IParameter } from '@shared/components/model-details/parameter-details/parameter-details.component';
import {
  IOpenModelZooFilter,
  OpenModelZooDataSource,
} from '@shared/models/model-zoo-data-source/open-model-zoo-data-source';

import { OMZModelPrecisionEnum } from '../model-downloader-table/model-downloader-table.component';
import { BaseModelZooImportComponent } from '../base-model-zoo-import/base-model-zoo-import.component';

@Component({
  selector: 'wb-omz-import-ribbon-content',
  templateUrl: './omz-import-ribbon-content.component.html',
  styleUrls: ['./omz-import-ribbon-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OmzImportRibbonContentComponent extends BaseModelZooImportComponent<
  ModelDownloaderDTO,
  IOpenModelZooFilter
> {
  readonly dataSource = new OpenModelZooDataSource();

  protected _selectedModel: ModelDownloaderDTO = null;
  get selectedModel(): ModelDownloaderDTO {
    return this._selectedModel;
  }
  set selectedModel(value: ModelDownloaderDTO) {
    this._selectedModel = value;
    this.selectedModelParameters = [
      // TODO Add/reuse meaningful tooltips
      { label: 'Framework', tooltip: 'Framework', value: modelFrameworkNamesMap[this._selectedModel?.framework] },
      { label: 'Task', tooltip: 'Tasks', value: TaskTypeToNameMap[this._selectedModel?.task_type] },
      { label: 'Domain', tooltip: 'Domain', value: ModelDomain.CV }, // TODO Add Model domain to omz models schema
      { label: 'Precision', tooltip: 'Precision', value: this._selectedModel?.precision.toString() },
    ];
  }

  selectedModelParameters: IParameter[] = [];

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

  readonly noConnectionMessage = this._messagesService.hintMessages.downloaderTips.cannotLoadModelWithoutConnection;
  readonly unavailableOmzModelMessage = this._messagesService.hintMessages.downloaderTips.unavailableOmzModel;

  private readonly _omzModels$ = this._store$.select(ModelStoreSelectors.selectOMZModels);

  private readonly _frameworksAvailability$ = this._store$.select(GlobalsStoreSelectors.selectFrameworksAvailability);
  private _frameworksAvailability: IFrameworksAvailability = null;

  private readonly _hasInternetConnection$ = this._store$.select(GlobalsStoreSelectors.selectConnectionStatusState);
  hasInternetConnection = false;

  constructor(
    private readonly _store$: Store<RootStoreState.State>,
    private readonly _messagesService: MessagesService
  ) {
    super();
    this.sortControl.setValue(this.dataSource.defaultSortOption);

    this._omzModels$.pipe(takeUntil(this._unsubscribe$)).subscribe((models) => {
      this.dataSource.data = models;
    });

    this._frameworksAvailability$.pipe(takeUntil(this._unsubscribe$)).subscribe((value) => {
      this._frameworksAvailability = value;
    });

    this._hasInternetConnection$.pipe(takeUntil(this._unsubscribe$)).subscribe((value) => {
      this.hasInternetConnection = value;
    });
  }

  protected get _dataSourceFilter(): IOpenModelZooFilter {
    return {
      name: this.modelSearch,
      filters: this.filtersControl?.value || {},
    };
  }

  get isImportDisabled(): boolean {
    return (
      !this.hasInternetConnection ||
      !this.selectedModel?.isAvailable ||
      (this.selectedModel.framework !== ModelFrameworks.OPENVINO && this.isGettingFrameworksAvailabilityFailed)
    );
  }

  get isGettingFrameworksAvailabilityFailed(): boolean {
    return Boolean(this._frameworksAvailability?.error);
  }

  get isSelectedModelFrameworkConfigured(): boolean {
    if (!this._frameworksAvailability || this.isGettingFrameworksAvailabilityFailed) {
      return false;
    }

    const selectedFramework = this.selectedModel.framework.toString();
    const { data: frameworksAvailability } = this._frameworksAvailability;

    return frameworksAvailability[selectedFramework] === FrameworksAvailabilityStates.CONFIGURED;
  }

  get selectedModelEnvironmentSetupHint(): string {
    return this._messagesService.getHint('frameworksAvailability', 'note', {
      frameworkName: modelFrameworkNamesMap[this.selectedModel?.framework],
    });
  }

  resetAllFilters(): void {
    // TODO Unify filters setting and deselecting depending on form control value
    const filters = this.filtersControl.value as Record<keyof ModelDownloaderDTO, string[]>;
    const clearedFilters = Object.fromEntries(Object.entries(filters).map(([key]) => [key, []]));
    this.filtersControl.setValue(clearedFilters);
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
