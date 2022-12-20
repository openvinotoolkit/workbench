import { UntypedFormGroup, Validators } from '@angular/forms';

import { isNumber } from 'lodash';

import { ModelFrameworks, ModelItem, ModelTaskMethods, ModelTaskTypes } from '@store/model-store/model.model';

import { IAdapter, IMaskRCNNNonTFAdapter, IMaskRCNNTFAdapter, IYoloV3V4Adapter } from '@shared/models/accuracy/adapter';
import { AdvancedConfigField } from '@shared/components/config-form-field/config-form-field.component';
import { IAccuracyConfiguration, IVisualizationConfiguration } from '@shared/models/accuracy';

import { createControl, IFormFeatureHandler, Subscriptions } from './index';

export class AdapterGroupHandler implements IFormFeatureHandler<IAdapter> {
  readonly group = new UntypedFormGroup({});

  readonly handlers: {
    yoloV3V4?: YoloV3V4AdapterGroupHandler;
    maskrcnn?: MaskrcnnAdapterGroupHandler;
  } = {};

  orderedFields: { field: AdvancedConfigField; group: UntypedFormGroup }[] = [];

  private readonly _subs = new Subscriptions();

  static isApplicable(taskMethod: ModelTaskMethods): boolean {
    return [
      ModelTaskMethods.MASK_RCNN_SEGMENTATION,
      ModelTaskMethods.YOLO_V3,
      ModelTaskMethods.YOLO_V4,
      ModelTaskMethods.TINY_YOLO_V3_V4,
    ].includes(taskMethod);
  }

  constructor(
    taskType: ModelTaskTypes,
    private _taskMethod: ModelTaskMethods,
    model: ModelItem,
    configuration: IAccuracyConfiguration | IVisualizationConfiguration
  ) {
    if (_taskMethod === ModelTaskMethods.MASK_RCNN_SEGMENTATION) {
      this.handlers.maskrcnn = new MaskrcnnAdapterGroupHandler(taskType, model, configuration);
    } else {
      this.handlers.yoloV3V4 = new YoloV3V4AdapterGroupHandler();
    }

    Object.entries(this.handlers).forEach(([key, handler]) => this.group.addControl(key, handler.group));

    this._subs.add = this.group.valueChanges.subscribe(() => this._setOrderedFields());

    this.setValue(configuration.adapterConfiguration);
    this._setOrderedFields();
  }

  private _setOrderedFields() {
    this.orderedFields = [
      ...(this.handlers.maskrcnn?.orderedFields || []),
      ...(this.handlers.yoloV3V4?.orderedFields || []),
    ].filter((v) => !!v);
  }

  setValue(adapter: IAdapter) {
    if (this._taskMethod === ModelTaskMethods.MASK_RCNN_SEGMENTATION) {
      this.handlers.maskrcnn.setValue(adapter as IMaskRCNNNonTFAdapter | IMaskRCNNTFAdapter);
    } else {
      this.handlers.yoloV3V4.setValue(adapter as IYoloV3V4Adapter);
    }
  }

  getValue(): IAdapter {
    if (this._taskMethod === ModelTaskMethods.MASK_RCNN_SEGMENTATION) {
      return this.handlers.maskrcnn.getValue();
    } else {
      return this.handlers.yoloV3V4.getValue();
    }
  }

  destroy(): void {
    this._subs.unsubscribe();
    Object.values(this.handlers).forEach((h) => h.destroy());
  }
}

export class YoloV3V4AdapterGroupHandler implements IFormFeatureHandler<IYoloV3V4Adapter> {
  private readonly _fields: { classes: AdvancedConfigField } = {
    classes: {
      type: 'input',
      label: 'Classes',
      name: 'classes',
      value: 80,
      numberType: 'integer',
      validators: [Validators.required, Validators.min(1)],
      tooltip: {
        prefix: 'accuracyParams',
        value: 'accuracy.yoloV3V4Classes',
      },
    },
  };

  readonly group = new UntypedFormGroup({
    [this._fields.classes.name]: createControl(this._fields.classes),
  });

  orderedFields: { field: AdvancedConfigField; group: UntypedFormGroup }[] = [
    { field: this._fields.classes, group: this.group },
  ];

  setValue(value: IYoloV3V4Adapter) {
    if (!isNumber(value?.classes)) {
      return;
    }

    this.group.patchValue({
      [this._fields.classes.name]: value.classes,
    });
  }

  getValue(): IYoloV3V4Adapter {
    return this.group.value;
  }

  destroy() {}
}

export class MaskrcnnAdapterGroupHandler implements IFormFeatureHandler<IMaskRCNNNonTFAdapter | IMaskRCNNTFAdapter> {
  private readonly _fields: {
    image_info_input: AdvancedConfigField;
    raw_masks_out: AdvancedConfigField;
    boxes_out: AdvancedConfigField;
    classes_out: AdvancedConfigField;
    scores_out: AdvancedConfigField;
    detection_out: AdvancedConfigField;
  } = {
    image_info_input: {
      type: 'select',
      label: 'Input Info Layer',
      name: 'image_info_input',
      value: '',
      options: [],
      validators: [Validators.required],
      tooltip: {
        prefix: 'accuracyParams',
        value: 'image_info_input',
      },
    },
    raw_masks_out: {
      type: 'select',
      label: 'Masks',
      name: 'raw_masks_out',
      value: '',
      options: [],
      validators: [Validators.required],
      tooltip: {
        prefix: 'accuracyParams',
        value: 'raw_masks_out',
      },
    },
    boxes_out: {
      type: 'select',
      label: 'Boxes',
      name: 'boxes_out',
      value: '',
      options: [],
      validators: [Validators.required],
      tooltip: {
        prefix: 'accuracyParams',
        value: 'boxes_out',
      },
    },
    classes_out: {
      type: 'select',
      label: 'Classes',
      name: 'classes_out',
      value: '',
      options: [],
      validators: [Validators.required],
      tooltip: {
        prefix: 'accuracyParams',
        value: 'classes_out',
      },
    },
    scores_out: {
      type: 'select',
      label: 'Scores',
      name: 'scores_out',
      value: '',
      options: [],
      validators: [Validators.required],
      tooltip: {
        prefix: 'accuracyParams',
        value: 'scores_out',
      },
    },
    detection_out: {
      type: 'select',
      label: 'Detection',
      name: 'detection_out',
      value: '',
      options: [],
      validators: [Validators.required],
      tooltip: {
        prefix: 'accuracyParams',
        value: 'detection_out',
      },
    },
  };

  readonly group = new UntypedFormGroup({});

  inputField: { field: AdvancedConfigField; group: UntypedFormGroup };
  orderedFields: { field: AdvancedConfigField; group: UntypedFormGroup }[] = [];

  static isApplicable(taskType: ModelTaskTypes): boolean {
    return taskType === ModelTaskTypes.INSTANCE_SEGMENTATION;
  }

  constructor(
    taskType: ModelTaskTypes,
    model: ModelItem,
    configuration: IAccuracyConfiguration | IVisualizationConfiguration
  ) {
    const inputs = model.analysis.inputs;
    const outputs = model.analysis.outputs;

    this.group.addControl('image_info_input', createControl(this._fields.image_info_input));
    this.inputField = { field: { ...this._fields.image_info_input, options: inputs }, group: this.group };

    let outputsForm: UntypedFormGroup;

    if (model.analysis.moParams.framework === ModelFrameworks.TF) {
      outputsForm = new UntypedFormGroup({
        raw_masks_out: createControl(this._fields.raw_masks_out),
        detection_out: createControl(this._fields.detection_out),
      });
      this.orderedFields = [
        { field: { ...this._fields.raw_masks_out, options: outputs }, group: outputsForm },
        { field: { ...this._fields.detection_out, options: outputs }, group: outputsForm },
      ];
    } else {
      outputsForm = new UntypedFormGroup({
        raw_masks_out: createControl(this._fields.raw_masks_out),
        boxes_out: createControl(this._fields.boxes_out),
        classes_out: createControl(this._fields.classes_out),
        scores_out: createControl(this._fields.scores_out),
      });
      this.orderedFields = [
        { field: { ...this._fields.raw_masks_out, options: outputs }, group: outputsForm },
        { field: { ...this._fields.boxes_out, options: outputs }, group: outputsForm },
        { field: { ...this._fields.classes_out, options: outputs }, group: outputsForm },
        { field: { ...this._fields.scores_out, options: outputs }, group: outputsForm },
      ];
    }

    this.group.addControl('outputs', outputsForm);

    if (configuration.taskType === ModelTaskTypes.INSTANCE_SEGMENTATION) {
      this.setValue(configuration.adapterConfiguration as IMaskRCNNNonTFAdapter | IMaskRCNNTFAdapter);
    } else if (model.analysis.topologySpecific.mask_rcnn) {
      const defaults = model.analysis.topologySpecific.mask_rcnn as IMaskRCNNNonTFAdapter | IMaskRCNNTFAdapter;
      this.setValue(defaults);
    }
  }

  setValue(value: IMaskRCNNNonTFAdapter | IMaskRCNNTFAdapter) {
    this.group.patchValue(value);
  }

  getValue(): IMaskRCNNNonTFAdapter | IMaskRCNNTFAdapter {
    return this.group.value;
  }

  destroy() {}
}
