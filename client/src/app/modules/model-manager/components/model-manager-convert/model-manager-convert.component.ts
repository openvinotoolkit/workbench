import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { FormGroup } from '@angular/forms';

import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { Store } from '@ngrx/store';

import { MessagesService } from '@core/services/common/messages.service';

import {
  ModelColorChannels,
  ModelConvertConfigDTO,
  ModelDomain,
  ModelItem,
  ModelSources,
} from '@store/model-store/model.model';
import { ProjectStatusNames } from '@store/project-store/project.model';
import { ModelStoreSelectors } from '@store';

import { isHuggingfaceModel, isOriginalModel, isTFObjectDetectionAPI } from './model-helpers';
import { HelpChecklistService } from './help-checklist/help-checklist.service';
import { ConversionInputsGroupComponent } from './conversion-inputs-group/conversion-inputs-group.component';

@Component({
  selector: 'wb-model-manager-convert',
  templateUrl: './model-manager-convert.component.html',
  styleUrls: ['./model-manager-convert.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelManagerConvertComponent implements OnInit, OnDestroy {
  private _model: ModelItem;
  @Input() set model(item: ModelItem) {
    this._model = item;

    if (this._model?.status.name === ProjectStatusNames.ERROR) {
      this.isConversionStarted = false;
    }
  }
  get model(): ModelItem {
    return this._model;
  }

  @Output()
  public readonly convertModel: EventEmitter<ModelConvertConfigDTO> = new EventEmitter<ModelConvertConfigDTO>();

  @Output()
  public readonly cancel: EventEmitter<void> = new EventEmitter<void>();

  @Output()
  public readonly updateInputsState: EventEmitter<boolean> = new EventEmitter<boolean>();

  @ViewChild(ConversionInputsGroupComponent)
  private _conversionInputsGroupComponent: ConversionInputsGroupComponent;

  readonly conversionTipValidationMessage = this._messageService.hintMessages.conversionTips.validationFails;
  public readonly ModelDomain = ModelDomain;

  public colorSpace: ModelColorChannels;

  public group = new FormGroup({});

  public isInputsSpecified = false;

  public isConversionStarted = false;

  private _unsubscribe$: Subject<void> = new Subject<void>();

  private readonly _modelIsLoading$ = this._store$.select(ModelStoreSelectors.selectModelIsLoading);

  constructor(
    private _store$: Store,
    public helpChecklistService: HelpChecklistService,
    private _messageService: MessagesService
  ) {}

  ngOnInit(): void {
    this.group.valueChanges.pipe(takeUntil(this._unsubscribe$)).subscribe(({ general, inputs }) => {
      this.colorSpace = general.originalChannelsOrder;

      this.isInputsSpecified = !!inputs;
      this.updateInputsState.emit(this.isInputsSpecified);
    });
    this._modelIsLoading$
      .pipe(
        takeUntil(this._unsubscribe$),
        filter((value) => !value)
      )
      .subscribe((isLoading) => {
        this.isConversionStarted = isLoading;
      });
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  submit(): void {
    if (!this.model || this.group.invalid) {
      return;
    }

    const { general, files, inputs, advanced } = this.group.value;
    const payload: ModelConvertConfigDTO = {
      dataType: general.dataType,
      originalChannelsOrder: general.originalChannelsOrder,
      legacyMxnetModel: general.legacyMxnetModel,
      enableSsdGluoncv: general.enableSsdGluoncv,

      pipelineConfigFile: files?.pipelineConfigFile,
      predefinedTransformationsConfig: files?.predefinedTransformationsConfig,
      customTransformationsConfig: files?.customTransformationsConfig,

      originalLayout: advanced?.originalLayout,
      outputs: advanced?.outputs,
    };

    if (inputs?.inputs) {
      payload.inputs = inputs?.inputs;
    }

    if (this.model.modelSource === ModelSources.OMZ) {
      payload.topologyId = this.model.id;
    }

    this.convertModel.emit(payload);
    this.isConversionStarted = true;
  }

  usePipelineConfigChecked(): void {
    this._conversionInputsGroupComponent?.clearShapes();
  }

  get isOriginalModel(): boolean {
    return isOriginalModel(this.model);
  }

  get isHuggingfaceModel(): boolean {
    return isHuggingfaceModel(this.model);
  }

  get isTFObjectDetectionAPI(): boolean {
    return isTFObjectDetectionAPI(this.model);
  }
}
