import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, Validators } from '@angular/forms';

import { isNumber } from 'lodash';

import { MessagesService } from '@core/services/common/messages.service';

import { ModelDomain, ModelItem, ModelTaskTypes, TaskTypeToNameMap } from '@store/model-store/model.model';
import { DatasetItem, DatasetTypes } from '@store/dataset-store/dataset.model';

import { AccuracyReportType } from '@shared/models/accuracy-analysis/accuracy-report';

export class AccuracyReportTypeControlOptions {
  readonly accuracyReportTypeNames = {
    [AccuracyReportType.DATASET_ANNOTATIONS]: 'Accuracy Evaluation on Validation Dataset',
    [AccuracyReportType.PARENT_MODEL_PREDICTIONS]: 'Comparison of Optimized and Parent Model Predictions',
    [AccuracyReportType.PARENT_MODEL_PER_TENSOR]: 'Calculation of Tensor Distance to Parent Model Output',
  };

  private readonly _accuracyReportHints = this._messagesService.hintMessages.createAccuracyReportRibbon;

  readonly accuracyReportOptions: RadioGroupOptions = {
    [AccuracyReportType.DATASET_ANNOTATIONS]: {
      label: this.accuracyReportTypeNames[AccuracyReportType.DATASET_ANNOTATIONS],
      description: this._accuracyReportHints.validationDatasetTypeDescription,
      disabled: false,
      disabledMessage: '',
    },
    [AccuracyReportType.PARENT_MODEL_PREDICTIONS]: {
      label: this.accuracyReportTypeNames[AccuracyReportType.PARENT_MODEL_PREDICTIONS],
      description: this._accuracyReportHints.parentModelPredictionsTypeDescription,
      disabled: false,
      disabledMessage: '',
    },
    [AccuracyReportType.PARENT_MODEL_PER_TENSOR]: {
      label: this.accuracyReportTypeNames[AccuracyReportType.PARENT_MODEL_PER_TENSOR],
      description: this._accuracyReportHints.parentModelTensorDistanceDescription,
      disabled: false,
      disabledMessage: '',
    },
  };

  readonly accuracyReportTypeControl = new FormControl(null, Validators.required);

  private readonly _supportedTaskTypesForParentModelPredictionsReport = [
    ModelTaskTypes.OBJECT_DETECTION,
    ModelTaskTypes.CLASSIFICATION,
    ModelTaskTypes.INSTANCE_SEGMENTATION,
    ModelTaskTypes.SEMANTIC_SEGMENTATION,
  ];

  constructor(private _messagesService: MessagesService) {}

  protected get accuracyReportTypes(): AccuracyReportType[] {
    return <AccuracyReportType[]>Object.keys(this.accuracyReportOptions);
  }

  protected disableReportType(reportType: AccuracyReportType, disabledMessage: string = ''): void {
    const reportOption = this.accuracyReportOptions[reportType];
    if (!reportOption) {
      return;
    }
    reportOption.disabled = true;
    reportOption.disabledMessage = disabledMessage;
  }

  protected enableReportType(reportType: AccuracyReportType): void {
    const reportOption = this.accuracyReportOptions[reportType];
    if (!reportOption) {
      return;
    }
    reportOption.disabled = false;
    reportOption.disabledMessage = '';
  }

  protected selectAvailableReportType(): void {
    if (!this.accuracyReportOptions[AccuracyReportType.DATASET_ANNOTATIONS].disabled) {
      this.accuracyReportTypeControl.setValue(AccuracyReportType.DATASET_ANNOTATIONS);
    } else if (!this.accuracyReportOptions[AccuracyReportType.PARENT_MODEL_PREDICTIONS].disabled) {
      this.accuracyReportTypeControl.setValue(AccuracyReportType.PARENT_MODEL_PREDICTIONS);
    } else if (!this.accuracyReportOptions[AccuracyReportType.PARENT_MODEL_PER_TENSOR].disabled) {
      this.accuracyReportTypeControl.setValue(AccuracyReportType.PARENT_MODEL_PER_TENSOR);
    } else {
      this.accuracyReportTypeControl.setValue(null);
    }
  }

  protected setOptionsValidity(
    model: ModelItem,
    dataset: DatasetItem,
    projectId: number,
    isInt8Available: boolean
  ): void {
    if (model?.domain === ModelDomain.NLP) {
      const message = this._messagesService.hintMessages.createAccuracyReportRibbon.nlpModelAccuracyDisabledMessage;
      this.disableReportType(AccuracyReportType.DATASET_ANNOTATIONS, message);
      this.disableReportType(AccuracyReportType.PARENT_MODEL_PREDICTIONS, message);
      this.disableReportType(AccuracyReportType.PARENT_MODEL_PER_TENSOR, message);
    } else if (!model?.analysis.isInt8) {
      let notOptimizedModelDisabledMessage: string = null;
      if (isInt8Available) {
        notOptimizedModelDisabledMessage = this._messagesService.getHint(
          'createAccuracyReportRibbon',
          'notOptimizedModelDisabledMessage',
          { projectId }
        );
      } else {
        notOptimizedModelDisabledMessage = this._messagesService.getHint(
          'createAccuracyReportRibbon',
          'targetInt8NotSupported',
          { modelId: model?.id, datasetId: dataset?.id }
        );
      }

      this.disableReportType(AccuracyReportType.PARENT_MODEL_PREDICTIONS, notOptimizedModelDisabledMessage);
      this.disableReportType(AccuracyReportType.PARENT_MODEL_PER_TENSOR, notOptimizedModelDisabledMessage);
    } else if (!isNumber(model?.optimizedFromModelId)) {
      const externallyOptimizedModelDisabledMessage = this._accuracyReportHints.externallyOptimizedModelDisabledMessage;
      this.disableReportType(AccuracyReportType.PARENT_MODEL_PREDICTIONS, externallyOptimizedModelDisabledMessage);
      this.disableReportType(AccuracyReportType.PARENT_MODEL_PER_TENSOR, externallyOptimizedModelDisabledMessage);
    } else if (model?.analysis.inputs.length > 1) {
      this.disableReportType(
        AccuracyReportType.PARENT_MODEL_PER_TENSOR,
        this._accuracyReportHints.multiInputTopologyMessage
      );
    } else if (
      !this._supportedTaskTypesForParentModelPredictionsReport.includes(model?.accuracyConfiguration?.taskType)
    ) {
      const supportedTaskTypesNames = this._supportedTaskTypesForParentModelPredictionsReport
        .map((taskType) => TaskTypeToNameMap[taskType])
        .toString();
      const disabledMessage = this._messagesService.getHint(
        'createAccuracyReportRibbon',
        'notSupportedModelTaskTypeDisabledMessage',
        {
          taskTypeName: TaskTypeToNameMap[model?.accuracyConfiguration?.taskType],
          supportedTaskTypesNames,
        }
      );
      this.disableReportType(AccuracyReportType.PARENT_MODEL_PREDICTIONS, disabledMessage);
    }

    if (dataset?.type === DatasetTypes.NOT_ANNOTATED) {
      this.disableReportType(
        AccuracyReportType.DATASET_ANNOTATIONS,
        this._accuracyReportHints.notAnnotatedDatasetReportDisabledMessage
      );
    }
  }
}

export interface RadioGroupOption {
  label: string;
  description: string;
  disabled: boolean;
  disabledMessage: string;
}

interface RadioGroupOptions {
  [optionKey: string]: RadioGroupOption;
}

// TODO 65500 Consider generalizing and reusing of such component for other row radio groups (e.g. in optimize ribbon)
@Component({
  selector: 'wb-accuracy-report-type-radio-group',
  templateUrl: './accuracy-report-type-radio-group.component.html',
  styleUrls: ['./accuracy-report-type-radio-group.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AccuracyReportTypeRadioGroupComponent),
      multi: true,
    },
  ],
})
export class AccuracyReportTypeRadioGroupComponent implements ControlValueAccessor {
  readonly accuracyReportTypes = [
    AccuracyReportType.DATASET_ANNOTATIONS,
    AccuracyReportType.PARENT_MODEL_PREDICTIONS,
    AccuracyReportType.PARENT_MODEL_PER_TENSOR,
  ];

  @Input() accuracyReportOptions: RadioGroupOptions;

  _selectedReportType: AccuracyReportType = null;
  set selectedReportType(value: AccuracyReportType) {
    this._selectedReportType = value;
    this._onChange(value);
  }

  get selectedReportType(): AccuracyReportType {
    return this._selectedReportType;
  }

  private _onChange = (_: AccuracyReportType) => {};
  private _onTouched = () => {};

  registerOnChange(fn: (_: AccuracyReportType) => {}): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => {}): void {
    this._onTouched = fn;
  }

  writeValue(value: AccuracyReportType): void {
    this._selectedReportType = value;
  }
}
