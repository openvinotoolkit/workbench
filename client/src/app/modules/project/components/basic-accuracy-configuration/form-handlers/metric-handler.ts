import { UntypedFormGroup, Validators } from '@angular/forms';

import { ModelItem, ModelTaskTypes } from '@store/model-store/model.model';

import {
  IAccuracyMetric,
  ICocoOrigPrecisionMetric,
  ICocoPrecisionMetric,
  IMapMetric,
  IMeanIOUMetric,
  IMetric,
  INormedErrorMetric,
  IPairwiseAccuracySubsetsMetric,
  IPSNRMetric,
  ISSIMMetric,
  MetricType,
} from '@shared/models/accuracy/metric';
import { AdvancedConfigField } from '@shared/components/config-form-field/config-form-field.component';

import { createControl, IFormFeatureHandler, Subscriptions } from './index';

export const METRIC_TYPE_NAME_MAP = {
  [MetricType.ACCURACY]: 'Accuracy',
  [MetricType.MAP]: 'mAP',
  [MetricType.COCO_PRECISION]: 'COCO Precision',
  [MetricType.MEAN_IOU]: 'Mean IOU',
  [MetricType.COCO_ORIG_SEGM_PRECISION]: 'COCO Segmentation Precision',
  [MetricType.PSNR]: 'PSNR',
  [MetricType.SSIM]: 'SSIM',
  [MetricType.NORMED_ERROR]: 'Normed Error',
  [MetricType.PAIRWISE_ACCURACY_SUBSETS]: 'Pairwise Subsets',
};

const getTypeField = (value: MetricType, options: MetricType[]): AdvancedConfigField => ({
  type: 'select',
  label: 'Metric',
  name: 'type',
  value,
  options: options.map((v) => ({ value: v, name: METRIC_TYPE_NAME_MAP[v] })),
  tooltip: {
    prefix: 'accuracyParams',
    value: 'metric',
  },
});

export class MetricGroupHandler implements IFormFeatureHandler<IMetric[]> {
  readonly group = new UntypedFormGroup({});

  orderedFields: { field: AdvancedConfigField; group: UntypedFormGroup }[] = [];

  private readonly _subs = new Subscriptions();

  handlers: {
    [MetricType.ACCURACY]?: AccuracyMetricHandler;
    object_detection?: ObjectDetectionMetricHandler;
    [MetricType.COCO_ORIG_SEGM_PRECISION]?: CocoOrigPrecisionMetricHandler;
    [MetricType.MEAN_IOU]?: MeanIOUMetricHandler;
    gan?: GANMetricHandler;
    [MetricType.NORMED_ERROR]?: NormedErrorMetricHandler;
    [MetricType.PAIRWISE_ACCURACY_SUBSETS]?: PairwiseAccuracySubsetsErrorMetricHandler;
  } = {};

  static isApplicable(): boolean {
    return true;
  }

  constructor(taskType: ModelTaskTypes, model: ModelItem) {
    this._setHandlers(taskType);
    Object.entries(this.handlers).forEach(([key, handler]) => this.group.addControl(key, handler.group));

    this._subs.add = this.group.valueChanges.subscribe(() => this._setOrderedFields());

    if (taskType === ModelTaskTypes.SEMANTIC_SEGMENTATION) {
      const use_argmax = model.analysis.topologySpecific?.segmentation?.use_argmax;
      if (typeof use_argmax === 'boolean') {
        this.setValue([{ type: MetricType.MEAN_IOU, use_argmax, presenter: 'print_vector' }]);
      }
    }

    if (taskType === ModelTaskTypes.LANDMARK_DETECTION) {
      this.handlers[MetricType.NORMED_ERROR] = new NormedErrorMetricHandler();
    }

    if (taskType === ModelTaskTypes.FACE_RECOGNITION) {
      this.handlers[MetricType.PAIRWISE_ACCURACY_SUBSETS] = new PairwiseAccuracySubsetsErrorMetricHandler();
    }

    this.setValue(model.accuracyConfiguration.metric);

    this._setOrderedFields();
  }

  private _setHandlers(taskType: ModelTaskTypes) {
    if (taskType === ModelTaskTypes.CLASSIFICATION) {
      this.handlers[MetricType.ACCURACY] = new AccuracyMetricHandler();
    }

    if (taskType === ModelTaskTypes.OBJECT_DETECTION) {
      this.handlers.object_detection = new ObjectDetectionMetricHandler();
    }

    if (taskType === ModelTaskTypes.SEMANTIC_SEGMENTATION) {
      this.handlers[MetricType.MEAN_IOU] = new MeanIOUMetricHandler();
    }

    if (taskType === ModelTaskTypes.INSTANCE_SEGMENTATION) {
      this.handlers[MetricType.COCO_ORIG_SEGM_PRECISION] = new CocoOrigPrecisionMetricHandler();
    }

    if (
      [ModelTaskTypes.SUPER_RESOLUTION, ModelTaskTypes.INPAINTING, ModelTaskTypes.STYLE_TRANSFER].includes(taskType)
    ) {
      this.handlers.gan = new GANMetricHandler();
    }
  }

  private _setOrderedFields() {
    this.orderedFields = Object.values(this.handlers)
      .reduce((acc, h) => {
        acc = [...acc, ...(h.orderedFields || [])];
        return acc;
      }, [])
      .filter((v) => !!v);
  }

  setValue(value: IMetric[] = []) {
    value.forEach((v) => {
      if (v.type === MetricType.ACCURACY) {
        this.handlers[MetricType.ACCURACY]?.setValue(v);
      }

      if (v.type === MetricType.MAP || v.type === MetricType.COCO_PRECISION) {
        this.handlers.object_detection?.setValue(v);
      }

      if (v.type === MetricType.COCO_PRECISION) {
        this.handlers.object_detection?.setValue(v);
      }

      if (v.type === MetricType.COCO_ORIG_SEGM_PRECISION) {
        this.handlers[MetricType.COCO_ORIG_SEGM_PRECISION]?.setValue(v);
      }

      if (v.type === MetricType.MEAN_IOU) {
        this.handlers[MetricType.MEAN_IOU]?.setValue(v);
      }

      if (v.type === MetricType.SSIM || v.type === MetricType.PSNR) {
        this.handlers.gan?.setValue(v);
      }
    });
  }

  getValue(): IMetric[] {
    return Object.values(this.handlers)
      .filter((v) => !!v)
      .map((handler) => handler.getValue())
      .filter((v) => !!v);
  }

  destroy() {
    this._subs.unsubscribe();
    Object.values(this.handlers).forEach((h) => h.destroy());
  }
}

export class AccuracyMetricHandler implements IFormFeatureHandler<IAccuracyMetric> {
  private readonly _fields: { type: AdvancedConfigField; top_k: AdvancedConfigField } = {
    type: getTypeField(MetricType.ACCURACY, [MetricType.ACCURACY]),
    top_k: {
      type: 'input',
      label: 'Top K (1-100)',
      name: 'top_k',
      value: 5,
      numberType: 'integer',
      maxNumber: 100,
      validators: [Validators.required, Validators.min(1), Validators.max(100)],
      tooltip: {
        prefix: 'accuracyParams',
        value: 'accuracy.top_k',
      },
    },
  };

  readonly group = new UntypedFormGroup({
    type: createControl(this._fields.type),
    top_k: createControl(this._fields.top_k),
  });

  readonly orderedFields: { field: AdvancedConfigField; group: UntypedFormGroup }[] = [
    { field: this._fields.type, group: this.group },
    { field: this._fields.top_k, group: this.group },
  ];

  setValue(metric: IAccuracyMetric) {
    this.group.controls.top_k.setValue(metric.top_k);
  }

  getValue(): IAccuracyMetric {
    const { top_k } = this.group.value;
    return { type: MetricType.ACCURACY, top_k, presenter: 'print_vector' };
  }

  destroy() {}
}

export class ObjectDetectionMetricHandler implements IFormFeatureHandler<IMapMetric | ICocoPrecisionMetric> {
  private readonly _fields: {
    type: AdvancedConfigField;
    overlap_threshold: AdvancedConfigField;
    integral: AdvancedConfigField;
    max_detections: AdvancedConfigField;
  } = {
    type: getTypeField(null, [MetricType.MAP, MetricType.COCO_PRECISION]),
    overlap_threshold: {
      type: 'input',
      label: 'Overlap Threshold',
      name: 'overlap_threshold',
      value: 0.5,
      numberType: 'float',
      validators: [Validators.required, Validators.min(0), Validators.max(1)],
      tooltip: {
        prefix: 'accuracyParams',
        value: 'map.overlap_threshold',
      },
    },
    integral: {
      type: 'select',
      label: 'Integral',
      name: 'integral',
      value: 'max',
      options: [
        { name: 'Max', value: 'max' },
        { name: '11 Point', value: '11point' },
      ],
      tooltip: {
        prefix: 'accuracyParams',
        value: 'map.integral',
      },
    },
    max_detections: {
      type: 'input',
      label: 'Max Detections',
      name: 'max_detections',
      value: 20,
      numberType: 'integer',
      validators: [Validators.required, Validators.min(0)],
      tooltip: {
        prefix: 'accuracyParams',
        value: 'coco_precision.max_detections',
      },
    },
  };

  readonly group = new UntypedFormGroup({
    type: createControl(this._fields.type),
  });

  orderedFields: { field: AdvancedConfigField; group: UntypedFormGroup }[] = [];

  private readonly _subs = new Subscriptions();

  constructor() {
    this._subs.add = this.group.controls.type.valueChanges.subscribe(
      (type: MetricType.MAP | MetricType.COCO_PRECISION) => {
        if (type === MetricType.MAP) {
          this.group.removeControl('max_detections');
          this.group.addControl('overlap_threshold', createControl(this._fields.overlap_threshold));
          this.group.addControl('integral', createControl(this._fields.integral));
          this.orderedFields = [
            { field: this._fields.type, group: this.group },
            { field: this._fields.overlap_threshold, group: this.group },
            { field: this._fields.integral, group: this.group },
          ];
        }
        if (type === MetricType.COCO_PRECISION) {
          this.group.addControl('max_detections', createControl(this._fields.max_detections));
          this.group.removeControl('overlap_threshold');
          this.group.removeControl('integral');
          this.orderedFields = [
            { field: this._fields.type, group: this.group },
            { field: this._fields.max_detections, group: this.group },
          ];
        }
      }
    );

    // set default value
    this.group.controls.type.setValue(MetricType.MAP);
  }

  setValue(metric: IMapMetric | ICocoPrecisionMetric) {
    this.group.controls.type.setValue(metric.type);
    if (metric.type === MetricType.MAP) {
      this.group.controls.integral.setValue(metric.integral);
      this.group.controls.overlap_threshold.setValue(metric.overlap_threshold);
    }

    if (metric.type === MetricType.COCO_PRECISION) {
      this.group.controls.max_detections.setValue(metric.max_detections);
    }
  }

  getValue(): IMapMetric | ICocoPrecisionMetric {
    const { type, integral, overlap_threshold, max_detections } = this.group.value;
    return type === MetricType.MAP
      ? { type: MetricType.MAP, integral, overlap_threshold, presenter: 'print_vector' }
      : { type: MetricType.COCO_PRECISION, max_detections, presenter: 'print_vector' };
  }

  destroy() {
    this._subs.unsubscribe();
  }
}

export class CocoOrigPrecisionMetricHandler implements IFormFeatureHandler<ICocoOrigPrecisionMetric> {
  private readonly _fields: { type: AdvancedConfigField; threshold: AdvancedConfigField } = {
    type: getTypeField(MetricType.COCO_ORIG_SEGM_PRECISION, [MetricType.COCO_ORIG_SEGM_PRECISION]),
    threshold: {
      type: 'threshold',
      name: 'threshold',
      disabled: true,
      value: '.50:.05:.95',
    },
  };

  readonly group = new UntypedFormGroup({
    type: createControl(this._fields.type),
    threshold: createControl(this._fields.threshold),
  });

  readonly orderedFields: { field: AdvancedConfigField; group: UntypedFormGroup }[] = [
    { field: this._fields.type, group: this.group },
    { field: this._fields.threshold, group: this.group },
  ];

  setValue(metric: ICocoOrigPrecisionMetric) {
    if (!metric.threshold) {
      return;
    }
    this.group.controls.threshold.setValue(metric.threshold);
  }

  getValue(): ICocoOrigPrecisionMetric {
    const { threshold } = this.group.value;
    return { type: MetricType.COCO_ORIG_SEGM_PRECISION, threshold, presenter: 'print_vector' };
  }

  destroy() {}
}

export class MeanIOUMetricHandler implements IFormFeatureHandler<IMeanIOUMetric> {
  private readonly _fields: { type: AdvancedConfigField; use_argmax: AdvancedConfigField } = {
    type: getTypeField(MetricType.MEAN_IOU, [MetricType.MEAN_IOU]),
    use_argmax: {
      type: 'select',
      label: 'Argmax',
      name: 'use_argmax',
      value: true,
      options: [
        { name: 'On', value: true },
        { name: 'Off', value: false },
      ],
      disabled: true,
      validators: [],
      tooltip: {
        prefix: 'accuracyParams',
        value: 'mean_iou.use_argmax',
      },
    },
  };

  readonly group = new UntypedFormGroup({
    type: createControl(this._fields.type),
    use_argmax: createControl(this._fields.use_argmax),
  });

  readonly orderedFields: { field: AdvancedConfigField; group: UntypedFormGroup }[] = [
    { field: this._fields.type, group: this.group },
    { field: this._fields.use_argmax, group: this.group },
  ];

  setValue(metric: IMeanIOUMetric) {
    this.group.controls.use_argmax.setValue(metric.use_argmax);
  }

  getValue(): IMeanIOUMetric {
    const { use_argmax } = this.group.value;
    return { type: MetricType.MEAN_IOU, use_argmax, presenter: 'print_vector' };
  }

  destroy() {}
}

export class GANMetricHandler implements IFormFeatureHandler<IPSNRMetric | ISSIMMetric> {
  private readonly _fields: { type: AdvancedConfigField } = {
    type: getTypeField(MetricType.SSIM, [MetricType.SSIM, MetricType.PSNR]),
  };

  readonly group = new UntypedFormGroup({ type: createControl(this._fields.type) });

  readonly orderedFields: { field: AdvancedConfigField; group: UntypedFormGroup }[] = [
    { field: this._fields.type, group: this.group },
  ];

  setValue(value: IPSNRMetric | ISSIMMetric) {
    this.group.controls.type.setValue(value.type);
  }

  getValue(): IPSNRMetric | ISSIMMetric {
    return { type: this.group.value.type, presenter: 'print_vector' };
  }

  destroy() {}
}

export class NormedErrorMetricHandler implements IFormFeatureHandler<INormedErrorMetric> {
  private readonly _fields: { type: AdvancedConfigField } = {
    type: getTypeField(MetricType.NORMED_ERROR, [MetricType.NORMED_ERROR]),
  };

  readonly group = new UntypedFormGroup({ type: createControl(this._fields.type) });

  readonly orderedFields: { field: AdvancedConfigField; group: UntypedFormGroup }[] = [
    { field: this._fields.type, group: this.group },
  ];

  setValue(_: INormedErrorMetric) {}

  getValue(): INormedErrorMetric {
    return { type: this.group.value.type };
  }

  destroy() {}
}

export class PairwiseAccuracySubsetsErrorMetricHandler implements IFormFeatureHandler<IPairwiseAccuracySubsetsMetric> {
  private readonly _fields: { type: AdvancedConfigField; subset_number: AdvancedConfigField } = {
    type: getTypeField(MetricType.PAIRWISE_ACCURACY_SUBSETS, [MetricType.PAIRWISE_ACCURACY_SUBSETS]),
    subset_number: {
      type: 'input',
      label: 'Subset Count',
      name: 'subset_number',
      value: 10,
      maxNumber: 100,
      numberType: 'integer',
      validators: [Validators.required, Validators.min(2)],
      tooltip: {
        prefix: 'accuracyParams',
        value: 'subset_count',
      },
    },
  };

  readonly group = new UntypedFormGroup({
    type: createControl(this._fields.type),
    subset_number: createControl(this._fields.subset_number),
  });

  readonly orderedFields: { field: AdvancedConfigField; group: UntypedFormGroup }[] = [
    { field: this._fields.type, group: this.group },
    { field: this._fields.subset_number, group: this.group },
  ];

  setValue(metric: IPairwiseAccuracySubsetsMetric) {
    this.group.controls.subset_number.setValue(metric.subset_number);
  }

  getValue(): IPairwiseAccuracySubsetsMetric {
    const { subset_number } = this.group.value;

    return { type: MetricType.PAIRWISE_ACCURACY_SUBSETS, subset_number };
  }

  destroy() {}
}
