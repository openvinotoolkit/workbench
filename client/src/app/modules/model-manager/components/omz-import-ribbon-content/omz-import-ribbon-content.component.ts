import { AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { FormBuilder } from '@angular/forms';

import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

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
import { OpenModelZooDataSource } from '@shared/models/model-zoo-data-source/open-model-zoo-data-source';

import { OMZModelPrecisionEnum } from '../model-downloader-table/model-downloader-table.component';

@Component({
  selector: 'wb-omz-import-ribbon-content',
  templateUrl: './omz-import-ribbon-content.component.html',
  styleUrls: ['./omz-import-ribbon-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OmzImportRibbonContentComponent implements AfterViewInit, OnDestroy {
  @ViewChild(MatPaginator) private _paginator: MatPaginator;

  readonly dataSource = new OpenModelZooDataSource();

  readonly sortControl = this._fb.control(this.dataSource.defaultSortOption);
  readonly filtersControl = this._fb.control({});

  readonly appliedFiltersCount$ = this.filtersControl.valueChanges.pipe(
    map(
      (filters: Record<keyof ModelDownloaderDTO, string[]>) =>
        Object.entries(filters).filter(([, value]) => value.length).length
    )
  );

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
  private _selectedModel: ModelDownloaderDTO = null;

  selectedModelParameters: IParameter[] = [];

  readonly ModelTaskTypeToNameMap = TaskTypeToNameMap;
  readonly modelFrameworkNamesMap = modelFrameworkNamesMap;

  readonly noConnectionMessage = this._messagesService.hintMessages.downloaderTips.cannotLoadModelWithoutConnection;
  readonly unavailableOmzModelMessage = this._messagesService.hintMessages.downloaderTips.unavailableOmzModel;

  private readonly _omzModels$ = this._store$.select(ModelStoreSelectors.selectOMZModels);

  private readonly _frameworksAvailability$ = this._store$.select(GlobalsStoreSelectors.selectFrameworksAvailability);
  private _frameworksAvailability: IFrameworksAvailability = null;

  private readonly _hasInternetConnection$ = this._store$.select(GlobalsStoreSelectors.selectConnectionStatusState);
  hasInternetConnection = false;

  private readonly _unsubscribe$ = new Subject<void>();

  constructor(
    private readonly _store$: Store<RootStoreState.State>,
    private readonly _messagesService: MessagesService,
    private readonly _fb: FormBuilder
  ) {
    this._omzModels$.pipe(takeUntil(this._unsubscribe$)).subscribe((models) => {
      this.dataSource.data = models;
    });

    this._frameworksAvailability$.pipe(takeUntil(this._unsubscribe$)).subscribe((value) => {
      this._frameworksAvailability = value;
    });

    this._hasInternetConnection$.pipe(takeUntil(this._unsubscribe$)).subscribe((value) => {
      this.hasInternetConnection = value;
    });

    this.sortControl.valueChanges.pipe(takeUntil(this._unsubscribe$)).subscribe((sort) => {
      this.dataSource.sort = sort;
    });

    this.filtersControl.valueChanges.pipe(takeUntil(this._unsubscribe$)).subscribe((filters) => {
      this.dataSource.appliedFilters = filters;
    });
  }

  get isImportDisabled(): boolean {
    return (
      !this.hasInternetConnection ||
      !this.selectedModel?.isAvailable ||
      (this.selectedModel.framework !== ModelFrameworks.OPENVINO && this.isGettingFrameworksAvailabilityFailed)
    );
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this._paginator;
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

  private _getOptionsByKey(key: keyof ModelDownloaderDTO): string[] {
    const availableOptions = this.dataSource.data?.reduce((acc, item) => {
      const fieldValue = item[key];
      if (Array.isArray(fieldValue)) {
        acc.push(...fieldValue.flat());
      } else {
        acc.push(fieldValue);
      }
      return acc;
    }, []);
    return Array.from(new Set(availableOptions));
  }

  get taskTypeOptions(): string[] {
    return this._getOptionsByKey('task_type');
  }

  get precisionOptions(): string[] {
    return this._getOptionsByKey('precision');
  }

  get frameworkOptions(): string[] {
    return this._getOptionsByKey('framework');
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

  searchModels(value: string): void {
    this.dataSource.filter = value;
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }
}
