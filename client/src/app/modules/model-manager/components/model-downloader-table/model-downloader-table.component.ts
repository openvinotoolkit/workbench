import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  QueryList,
  Renderer2,
  SimpleChanges,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';

import { isEmpty } from 'lodash';

import { MessagesService } from '@core/services/common/messages.service';

import {
  modelFrameworkNamesMap,
  ModelFrameworks,
  OMZColumnLabels,
  OMZColumnNames,
  TaskTypeToNameMap,
} from '@store/model-store/model.model';
import { FrameworksAvailabilityStates, IFrameworksAvailability } from '@store/globals-store/globals.state';

import { ModelDownloaderDTO } from '@shared/models/dto/model-downloader-dto';
import { AdvancedConfigField } from '@shared/components/config-form-field/config-form-field.component';
import {
  AppliedFilter,
  FilterableColumn,
  FilterableColumnOptions,
  IMatTableDataSource,
} from '@shared/components/table-filter-form/filter-form.model';

export enum OMZModelPrecisionEnum {
  FP32 = 'FP32',
  FP16 = 'FP16',
  INT8 = 'INT8',
}

// TODO [82812] Remove deprecated component
@Component({
  selector: 'wb-model-downloader-table',
  templateUrl: './model-downloader-table.component.html',
  styleUrls: ['./model-downloader-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelDownloaderTableComponent implements OnChanges, AfterViewInit {
  public static omzModelRowClassPrefix = 'omz-model-row';

  @Input()
  public isLoading = false;

  @Input()
  public detailsShown = false;

  @Input()
  public isConnected: boolean;

  @Input()
  public models: ModelDownloaderDTO[];

  @Input()
  public frameworksAvailability: IFrameworksAvailability = null;

  @Output()
  public importOMZModel: EventEmitter<{
    model: ModelDownloaderDTO;
    precision: OMZModelPrecisionEnum | null;
  }> = new EventEmitter<{ model: ModelDownloaderDTO; precision: OMZModelPrecisionEnum | null }>();

  @Output()
  public cancel: EventEmitter<null> = new EventEmitter();

  @Output() modelDetailsClick: EventEmitter<ModelDownloaderDTO> = new EventEmitter<ModelDownloaderDTO>();

  @ViewChild(MatSort) sort: MatSort;
  public modelsDataSource: IMatTableDataSource<ModelDownloaderDTO>;

  @ViewChildren('omzModelRow', { read: ElementRef })
  private omzModelRows: QueryList<ElementRef>;

  public selectedModel: ModelDownloaderDTO;

  public displayedColumns = [
    OMZColumnNames.MODEL_NAME,
    OMZColumnNames.DETAILS,
    OMZColumnNames.PRECISION,
    OMZColumnNames.FRAMEWORK,
    OMZColumnNames.TASK_TYPE,
  ];

  public ModelTaskTypeToNameMap = TaskTypeToNameMap;
  public modelFrameworkNamesMap = modelFrameworkNamesMap;
  public ModelFrameworks = ModelFrameworks;

  readonly noConnectionMessage = this.messagesService.hintMessages.downloaderTips.cannotLoadModelWithoutConnection;
  readonly unavailableOmzModelMessage = this.messagesService.hintMessages.downloaderTips.unavailableOmzModel;

  public getModelDownloaderDTOId = ModelDownloaderDTO.getId;

  public openvinoModelPrecisionFormGroup: FormGroup;

  public sortedColumn: Sort;

  public openvinoModelPrecisionField: AdvancedConfigField = {
    type: 'select',
    label: 'Precision',
    name: 'precision',
    value: OMZModelPrecisionEnum.FP16,
    options: [OMZModelPrecisionEnum.FP32, OMZModelPrecisionEnum.FP16, OMZModelPrecisionEnum.INT8],
    tooltip: {
      prefix: 'convertModel',
      value: 'precision',
    },
  };

  public OMZColumnNames = OMZColumnNames;
  public OMZColumnLabels = OMZColumnLabels;

  public filterableColumns: FilterableColumn[] = [
    {
      name: OMZColumnNames.MODEL_NAME,
      label: OMZColumnLabels.MODEL_NAME,
      type: 'set',
    },
    {
      name: OMZColumnNames.PRECISION,
      label: OMZColumnLabels.PRECISION,
      type: 'set',
    },
    {
      name: OMZColumnNames.FRAMEWORK,
      label: OMZColumnLabels.FRAMEWORK,
      type: 'set',
    },
    {
      name: OMZColumnNames.TASK_TYPE,
      label: OMZColumnLabels.TASK_TYPE,
      type: 'set',
    },
  ];

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private messagesService: MessagesService,
    private renderer: Renderer2,
    private fb: FormBuilder
  ) {
    this.modelsDataSource = new MatTableDataSource([]);
    this.openvinoModelPrecisionFormGroup = this.fb.group({
      precision: new FormControl(this.openvinoModelPrecisionField.value),
    });
  }

  get omzModelRowClassPrefix(): string {
    return ModelDownloaderTableComponent.omzModelRowClassPrefix;
  }

  get selectedPrecision() {
    return this.openvinoModelPrecisionFormGroup.get('precision').value;
  }

  get frameworkAvailabilityNote(): string {
    return this.messagesService.getHint('frameworksAvailability', 'note', {
      frameworkName: modelFrameworkNamesMap[this.selectedModel?.framework],
    });
  }

  get isGettingFrameworksAvailabilityFailed(): boolean {
    return !!this.frameworksAvailability?.error;
  }

  get isSelectedFrameworkConfigured(): boolean {
    if (this.isGettingFrameworksAvailabilityFailed) {
      return false;
    }

    const selectedFramework = this.selectedModel.framework.toString();
    const { data: frameworksAvailability } = this.frameworksAvailability;

    return frameworksAvailability[selectedFramework] === FrameworksAvailabilityStates.CONFIGURED;
  }

  get filterableColumnOptions(): FilterableColumnOptions {
    return null;
  }

  ngOnChanges(changes: SimpleChanges): void {
    const { models } = changes;
    if (!models || isEmpty(models.currentValue)) {
      return;
    }
    this.modelsDataSource = new MatTableDataSource(this.models);
    this.setDataSourceSortAndFiler();
  }

  ngAfterViewInit(): void {
    this.setDataSourceSortAndFiler();
  }

  private setDataSourceSortAndFiler(): void {
    this.modelsDataSource.sort = this.sort;
  }

  applyFilter(appliedFilter: AppliedFilter): void {
    this.modelsDataSource.filter = appliedFilter;
  }

  resetFilter(): void {
    this.modelsDataSource.filter = null;
  }

  isRowSelected(row: ModelDownloaderDTO): boolean {
    return this.selectedModel && this.selectedModel.name === row.name && this.selectedModel.precision === row.precision;
  }

  selectModelDetails(model: ModelDownloaderDTO) {
    this.selectedModel = model;
    this.modelDetailsClick.emit(model);
  }

  importModel(selectedModel: ModelDownloaderDTO) {
    if (selectedModel.framework === ModelFrameworks.OPENVINO) {
      this.importOMZModel.emit({ model: selectedModel, precision: this.selectedPrecision });
      return;
    }
    this.importOMZModel.emit({ model: selectedModel, precision: OMZModelPrecisionEnum.FP32 });
  }

  get isImportDisabled(): boolean {
    return (
      !this.selectedModel ||
      !this.selectedModel.isAvailable ||
      !this.isConnected ||
      (this.selectedModel.framework !== ModelFrameworks.OPENVINO && this.isGettingFrameworksAvailabilityFailed)
    );
  }

  get isUnavailableModel(): boolean {
    return this.isConnected && this.selectedModel && !this.selectedModel.isAvailable;
  }
}
