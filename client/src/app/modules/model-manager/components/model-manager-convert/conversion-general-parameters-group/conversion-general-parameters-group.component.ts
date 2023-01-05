import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { UntypedFormGroup, Validators } from '@angular/forms';

import { values } from 'lodash';

import {
  ModelColorChannels,
  ModelDomain,
  ModelFrameworks,
  ModelItem,
  ModelPrecisionEnum,
} from '@store/model-store/model.model';

import { FormUtils } from '@shared/utils/form-utils';
import { AdvancedConfigField } from '@shared/components/config-form-field/config-form-field.component';

import { isHuggingfaceModel, isOMZModel, isOriginalModel } from '../model-helpers';
import { HelpChecklistService } from '../help-checklist/help-checklist.service';

interface ConvertModelFieldsMapType {
  precision: AdvancedConfigField;
  colorSpace: AdvancedConfigField;
}

@Component({
  selector: 'wb-conversion-general-parameters-group',
  templateUrl: './conversion-general-parameters-group.component.html',
  styleUrls: ['./conversion-general-parameters-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConversionGeneralParametersGroupComponent implements OnChanges {
  @Input()
  model: ModelItem;

  @Input()
  parentGroup: UntypedFormGroup;

  @Output()
  setColorSpace = new EventEmitter<ModelColorChannels>();

  public readonly fields: ConvertModelFieldsMapType = {
    precision: {
      name: 'dataType',
      label: 'Precision',
      type: 'select',
      value: ModelPrecisionEnum.FP16,
      options: [ModelPrecisionEnum.FP32, ModelPrecisionEnum.FP16],
      tooltip: {
        prefix: 'convertModel',
        value: 'precision',
      },
    },
    colorSpace: {
      name: 'originalChannelsOrder',
      label: 'Original Color Space',
      type: 'select',
      value: null,
      options: [ModelColorChannels.RGB, ModelColorChannels.BGR, ModelColorChannels.Grayscale],
      validators: [Validators.required],
      tooltip: {
        prefix: 'convertModel',
        value: 'colorSpace',
      },
    },
  };
  public readonly frameworkAllSpecificFields: {
    legacyMxNetModel: AdvancedConfigField;
    enableSsdGluoncv: AdvancedConfigField;
  } = {
    legacyMxNetModel: {
      name: 'legacyMxnetModel',
      label: 'Legacy MXNet Model',
      type: 'checkbox',
      value: false,
      tooltip: {
        prefix: 'convertModel',
        value: 'legacyMxnet',
      },
    },
    enableSsdGluoncv: {
      name: 'enableSsdGluoncv',
      label: 'Enable SSD GluonCV',
      type: 'checkbox',
      value: false,
      tooltip: {
        prefix: 'convertModel',
        value: 'enableSsdGluoncv',
      },
    },
  };

  public readonly group = new UntypedFormGroup({});

  public frameworkSpecificFields: AdvancedConfigField[] = [];

  constructor(public helpChecklistService: HelpChecklistService) {
    this.build();
  }

  ngOnChanges(changes: SimpleChanges): void {
    const { model } = changes;

    if (!model.currentValue) {
      return;
    }

    if (this.parentGroup) {
      this.parentGroup.addControl('general', this.group);
    }

    this.build();
  }

  build(): void {
    FormUtils.addControlsToForm([this.fields.precision], this.group);

    if (this.model?.domain === ModelDomain.CV) {
      FormUtils.addControlsToForm([this.fields.colorSpace], this.group);
    }

    if (this.isOMZModel) {
      this.group.removeControl(this.fields.colorSpace.name);

      if (this.model.originalOmzPrecision === ModelPrecisionEnum.FP16) {
        this.group.get(this.fields.precision.name).setValue(ModelPrecisionEnum.FP16);
        this.group.get(this.fields.precision.name).disable();
      }

      if (this.model.originalOmzPrecision === ModelPrecisionEnum.I8) {
        this.group.removeControl(this.fields.precision.name);
      }
    }

    this.frameworkSpecificFields = this.getFrameworkSpecificFields(this.model?.originalModelFramework);

    if (this.isOriginalModel || this.isHuggingfaceModel) {
      // Add framework specific controls
      FormUtils.addControlsToForm(this.frameworkSpecificFields, this.group);
    } else {
      FormUtils.removeControlsFromForm(values(this.frameworkSpecificFields), this.group);
    }

    this.populate();
  }

  populate(): void {
    const params = this.model?.mo?.params;

    if (!params) {
      return;
    }

    this.group.patchValue({
      dataType: params.dataType,
      originalChannelsOrder: params.originalChannelsOrder,
      legacyMxnetModel: params.legacyMxnetModel,
      enableSsdGluoncv: params.enableSsdGluoncv,
    });
  }

  get isOMZModel(): boolean {
    return isOMZModel(this.model);
  }

  get isOriginalModel(): boolean {
    return isOriginalModel(this.model);
  }

  get isHuggingfaceModel(): boolean {
    return isHuggingfaceModel(this.model);
  }

  getFrameworkSpecificFields(framework: ModelFrameworks): AdvancedConfigField[] {
    if (framework === ModelFrameworks.MXNET) {
      return [this.frameworkAllSpecificFields.legacyMxNetModel, this.frameworkAllSpecificFields.enableSsdGluoncv];
    } else {
      return [];
    }
  }

  getTipTestId(name: string): string {
    return `more-${name}-tip`;
  }
}
