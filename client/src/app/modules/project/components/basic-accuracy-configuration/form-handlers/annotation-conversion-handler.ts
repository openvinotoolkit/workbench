import { FormGroup, Validators } from '@angular/forms';

import { ModelItem, ModelTaskTypes } from '@store/model-store/model.model';
import { DatasetTypes } from '@store/dataset-store/dataset.model';

import { IAnnotationConversion } from '@shared/models/accuracy/annotation-conversion';
import { AdvancedConfigField } from '@shared/components/config-form-field/config-form-field.component';

import { createControl, IFormFeatureHandler } from './index';

export class AnnotationConversionGroupHandler implements IFormFeatureHandler<IAnnotationConversion> {
  private readonly _fields: {
    has_background: AdvancedConfigField;
    use_full_label_map: AdvancedConfigField;
    two_streams: AdvancedConfigField;
  } = {
    has_background: {
      type: 'select',
      label: 'Separate Background Class',
      name: 'has_background',
      value: false,
      options: [
        { name: 'Yes', value: true },
        { name: 'No', value: false },
      ],
      tooltip: {
        prefix: 'accuracyParams',
        value: 'has_background',
      },
    },
    use_full_label_map: {
      type: 'select',
      label: 'Predictions are mapped to',
      name: 'use_full_label_map',
      value: false,
      options: [
        { name: '91 COCO classes', value: true },
        { name: '80 COCO classes', value: false },
      ],
      tooltip: {
        prefix: 'accuracyParams',
        value: 'use_full_label_map',
      },
    },
    two_streams: {
      type: 'radio',
      label: 'Two Streams',
      name: 'two_streams',
      value: true,
      options: [
        { name: 'Yes', value: true },
        { name: 'No', value: false },
      ],
      validators: [Validators.required],
      tooltip: {
        prefix: 'accuracyParams',
        value: 'two_streams',
      },
    },
  };

  readonly group = new FormGroup({});

  orderedFields: { field: AdvancedConfigField; group: FormGroup }[] = [];

  static isApplicable(taskType: ModelTaskTypes, datasetType: DatasetTypes): boolean {
    const applicableTaskType = ![
      ModelTaskTypes.INPAINTING,
      ModelTaskTypes.STYLE_TRANSFER,
      ModelTaskTypes.LANDMARK_DETECTION,
      ModelTaskTypes.FACE_RECOGNITION,
    ].includes(taskType);
    const applicableDatasetType = [
      DatasetTypes.COCO,
      DatasetTypes.VOC,
      DatasetTypes.IMAGE_NET_TXT,
      DatasetTypes.COMMON_SUPER_RESOLUTION,
    ].includes(datasetType);

    return applicableTaskType && applicableDatasetType;
  }

  constructor(datasetType: DatasetTypes, model: ModelItem) {
    if (datasetType === DatasetTypes.COMMON_SUPER_RESOLUTION) {
      this.group.addControl('two_streams', createControl(this._fields.two_streams));
      this.orderedFields = [{ field: this._fields.two_streams, group: this.group }];
    } else if (datasetType === DatasetTypes.IMAGE_NET_TXT || datasetType === DatasetTypes.VOC) {
      this.group.addControl('has_background', createControl(this._fields.has_background));
      this.orderedFields = [{ field: this._fields.has_background, group: this.group }];
    } else if (datasetType === DatasetTypes.COCO) {
      this.group.addControl('use_full_label_map', createControl(this._fields.use_full_label_map));
      this.group.addControl('has_background', createControl(this._fields.has_background));
      this.orderedFields = [
        { field: this._fields.has_background, group: this.group },
        { field: this._fields.use_full_label_map, group: this.group },
      ];
    }

    this.setValue(model.accuracyConfiguration.annotationConversion);
  }

  setValue(value: IAnnotationConversion) {
    if (!value) {
      return;
    }
    this.group.patchValue(value);
  }

  getValue(): IAnnotationConversion {
    return this.group.value;
  }

  destroy() {}
}
