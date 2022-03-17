import { FormGroup, Validators } from '@angular/forms';

import { ModelTaskMethods, ModelTaskTypes } from '@store/model-store/model.model';

import {
  IEncodeSegmentationMask,
  INMSPostProcessor,
  INormalizeLandmarkPointsPostProcessor,
  IPostProcessor,
  IResizePredictionBoxesPostProcessor,
  IResizeSegmentationMask,
  PostProcessorType,
} from '@shared/models/accuracy/post-processor';
import { AdvancedConfigField } from '@shared/components/config-form-field/config-form-field.component';
import { IAccuracyConfiguration, IVisualizationConfiguration } from '@shared/models/accuracy';

import { createControl, IFormFeatureHandler, Subscriptions } from './index';

export class PostProcessorGroupHandler implements IFormFeatureHandler<IPostProcessor[]> {
  readonly group = new FormGroup({});

  orderedFields: { field: AdvancedConfigField; group: FormGroup }[] = [];

  private readonly _subs = new Subscriptions();

  readonly handlers: {
    boxes?: BoxesPostProcessorHandler;
    encode_segmentation_mask?: EncodeSegmentationMaskPostProcessorHandler;
    resize_segmentation_mask?: ResizeSegmentationMaskPostProcessorHandler;
    normalize_landmarks_points?: NormalizeLandmarkPointsPostProcessorHandler;
  } = {};

  static isApplicable(taskType: ModelTaskTypes): boolean {
    return (
      taskType === ModelTaskTypes.OBJECT_DETECTION ||
      taskType === ModelTaskTypes.SEMANTIC_SEGMENTATION ||
      taskType === ModelTaskTypes.LANDMARK_DETECTION
    );
  }

  constructor(
    taskType: ModelTaskTypes,
    taskMethod: ModelTaskMethods,
    configuration: IAccuracyConfiguration | IVisualizationConfiguration
  ) {
    if (taskMethod === ModelTaskMethods.SEMANTIC_SEGMENTATION) {
      this.handlers.encode_segmentation_mask = new EncodeSegmentationMaskPostProcessorHandler();
      this.handlers.resize_segmentation_mask = new ResizeSegmentationMaskPostProcessorHandler();
    }

    if (taskType === ModelTaskTypes.OBJECT_DETECTION) {
      this.handlers.boxes = new BoxesPostProcessorHandler(taskMethod);
    }

    if (taskType === ModelTaskTypes.LANDMARK_DETECTION) {
      this.handlers.normalize_landmarks_points = new NormalizeLandmarkPointsPostProcessorHandler();
    }

    Object.entries(this.handlers).forEach(([key, handler]) => this.group.addControl(key, handler.group));

    this._subs.add = this.group.valueChanges.subscribe(() => this._setOrderedFields());

    if (taskType === configuration.taskType) {
      this.setValue(configuration.postprocessing);
    }

    this._setOrderedFields();
  }

  private _setOrderedFields() {
    this.orderedFields = [
      ...(this.handlers.boxes?.orderedFields || []),
      ...(this.handlers.encode_segmentation_mask?.orderedFields || []),
      ...(this.handlers.resize_segmentation_mask?.orderedFields || []),
      ...(this.handlers.normalize_landmarks_points?.orderedFields || []),
    ].filter((v) => !!v);
  }

  setValue(postprocessing: IPostProcessor[] = []) {
    const boxesProcessors: (IResizePredictionBoxesPostProcessor | INMSPostProcessor)[] = [];
    for (const p of postprocessing) {
      if (p.type === PostProcessorType.RESIZE_PREDICTION_BOXES || PostProcessorType.NMS === p.type) {
        boxesProcessors.push(p);
      }
    }
    this.handlers.boxes?.setValue(boxesProcessors);
  }

  getValue(): IPostProcessor[] {
    return Object.values(this.handlers).reduce((acc, h) => {
      if (!h) {
        return acc;
      }

      if (h instanceof BoxesPostProcessorHandler) {
        acc = [...acc, ...(h.getValue() || [])];
      } else {
        acc = [...acc, h.getValue()];
      }

      return acc.filter((v) => !!v);
    }, []);
  }

  destroy() {
    this._subs.unsubscribe();
    Object.values(this.handlers).forEach((h) => h.destroy());
  }
}

enum ResizePredictionBoxesOptions {
  NONE = 'None',
  RESIZE_BOXES = 'ResizeBoxes',
  RESIZE_BOXES_NMS = 'ResizeBoxes NMS',
}

export class BoxesPostProcessorHandler
  implements IFormFeatureHandler<(IResizePredictionBoxesPostProcessor | INMSPostProcessor)[]> {
  private readonly _fields: { resize_prediction_boxes: AdvancedConfigField; overlap: AdvancedConfigField } = {
    resize_prediction_boxes: {
      type: 'select',
      label: 'Prediction Boxes',
      name: 'resize_prediction_boxes',
      value: ResizePredictionBoxesOptions.NONE,
      options: [
        ResizePredictionBoxesOptions.NONE,
        ResizePredictionBoxesOptions.RESIZE_BOXES,
        ResizePredictionBoxesOptions.RESIZE_BOXES_NMS,
      ],
      tooltip: {
        prefix: 'accuracyParams',
        value: 'resize_prediction_boxes',
      },
    },
    overlap: {
      type: 'input',
      label: 'NMS Overlap',
      name: 'overlap',
      value: 0.5,
      numberType: 'float',
      validators: [Validators.required, Validators.min(0), Validators.max(1)],
      tooltip: {
        prefix: 'accuracyParams',
        value: 'nms.overlap',
      },
    },
  };

  readonly group = new FormGroup({
    resize_prediction_boxes: createControl(this._fields.resize_prediction_boxes),
  });

  orderedFields: { field: AdvancedConfigField; group: FormGroup }[] = [
    { field: this._fields.resize_prediction_boxes, group: this.group },
  ];

  private readonly _subs = new Subscriptions();

  constructor(taskMethod: ModelTaskMethods) {
    this._subs.add = this.group.controls['resize_prediction_boxes'].valueChanges.subscribe(
      (value: ResizePredictionBoxesOptions) => {
        if (value === ResizePredictionBoxesOptions.RESIZE_BOXES_NMS) {
          this.group.addControl('overlap', createControl(this._fields.overlap));
          this.orderedFields = [
            { field: this._fields.resize_prediction_boxes, group: this.group },
            { field: this._fields.overlap, group: this.group },
          ];
        } else {
          this.group.removeControl('overlap');
          this.orderedFields = [{ field: this._fields.resize_prediction_boxes, group: this.group }];
        }
      }
    );

    if (taskMethod === ModelTaskMethods.SSD) {
      this.group.controls.resize_prediction_boxes.setValue(ResizePredictionBoxesOptions.RESIZE_BOXES);
    } else if (
      [
        ModelTaskMethods.YOLO_V2,
        ModelTaskMethods.TINY_YOLO_V2,
        ModelTaskMethods.YOLO_V3,
        ModelTaskMethods.YOLO_V4,
        ModelTaskMethods.TINY_YOLO_V3_V4,
      ].includes(taskMethod)
    ) {
      this.group.controls.resize_prediction_boxes.setValue(ResizePredictionBoxesOptions.RESIZE_BOXES_NMS);
    }
  }

  setValue(value: (IResizePredictionBoxesPostProcessor | INMSPostProcessor)[]) {
    if (!value || !value.length) {
      this.group.controls.resize_prediction_boxes.setValue(ResizePredictionBoxesOptions.NONE);
    }

    const resizeBoxes = value.find(
      (v) => v.type === PostProcessorType.RESIZE_PREDICTION_BOXES
    ) as IResizePredictionBoxesPostProcessor;
    const nms = value.find((v) => v.type === PostProcessorType.NMS) as INMSPostProcessor;

    if (resizeBoxes && nms) {
      this.group.controls.resize_prediction_boxes.setValue(ResizePredictionBoxesOptions.RESIZE_BOXES_NMS);
      this.group.controls.overlap.setValue(nms.overlap);
    } else if (resizeBoxes) {
      this.group.controls.resize_prediction_boxes.setValue(ResizePredictionBoxesOptions.RESIZE_BOXES);
    }
  }

  getValue(): (IResizePredictionBoxesPostProcessor | INMSPostProcessor)[] {
    const { resize_prediction_boxes, overlap } = this.group.value;

    if (resize_prediction_boxes === ResizePredictionBoxesOptions.NONE) {
      return null;
    }

    if (resize_prediction_boxes === ResizePredictionBoxesOptions.RESIZE_BOXES) {
      return [{ type: PostProcessorType.RESIZE_PREDICTION_BOXES }];
    }

    if (resize_prediction_boxes === ResizePredictionBoxesOptions.RESIZE_BOXES_NMS) {
      return [{ type: PostProcessorType.RESIZE_PREDICTION_BOXES }, { type: PostProcessorType.NMS, overlap }];
    }
  }

  destroy() {
    this._subs.unsubscribe();
  }
}

export class EncodeSegmentationMaskPostProcessorHandler implements IFormFeatureHandler<IEncodeSegmentationMask> {
  private readonly _fields: { encode_segmentation_mask: AdvancedConfigField } = {
    encode_segmentation_mask: {
      type: 'select',
      label: 'Segmentation Mask Encoding',
      name: 'encode_segmentation_mask',
      value: 'annotation',
      disabled: true,
      options: [{ name: 'Annotation', value: 'annotation' }],
      validators: [Validators.required],
      tooltip: {
        prefix: 'accuracyParams',
        value: 'encode_segmentation_mask.apply_to',
      },
    },
  };

  readonly group = new FormGroup({
    encode_segmentation_mask: createControl(this._fields.encode_segmentation_mask),
  });

  orderedFields: { field: AdvancedConfigField; group: FormGroup }[] = [
    { field: this._fields.encode_segmentation_mask, group: this.group },
  ];

  setValue(_: IEncodeSegmentationMask) {}

  getValue(): IEncodeSegmentationMask {
    return { type: PostProcessorType.ENCODE_SEGMENTATION_MASK, apply_to: 'annotation' };
  }

  destroy() {}
}

export class ResizeSegmentationMaskPostProcessorHandler implements IFormFeatureHandler<IResizeSegmentationMask> {
  private readonly _fields: { resize_segmentation_mask: AdvancedConfigField } = {
    resize_segmentation_mask: {
      type: 'select',
      label: 'Segmentation Mask Resizing',
      name: 'resize_segmentation_mask',
      value: 'prediction',
      disabled: true,
      options: [{ name: 'Prediction', value: 'prediction' }],
      validators: [Validators.required],
      tooltip: {
        prefix: 'accuracyParams',
        value: 'resize_segmentation_mask.apply_to',
      },
    },
  };

  readonly group = new FormGroup({
    resize_segmentation_mask: createControl(this._fields.resize_segmentation_mask),
  });

  orderedFields: { field: AdvancedConfigField; group: FormGroup }[] = [
    { field: this._fields.resize_segmentation_mask, group: this.group },
  ];

  setValue(_: IResizeSegmentationMask) {}

  getValue(): IResizeSegmentationMask {
    return { type: PostProcessorType.RESIZE_SEGMENTATION_MASK, apply_to: 'prediction' };
  }

  destroy() {}
}

export class NormalizeLandmarkPointsPostProcessorHandler
  implements IFormFeatureHandler<INormalizeLandmarkPointsPostProcessor> {
  private readonly _fields: { normalize_landmarks_points: AdvancedConfigField } = {
    normalize_landmarks_points: {
      type: 'select',
      label: 'Landmark Processing',
      name: 'normalize_landmarks_points',
      value: 'normalize_landmarks_points',
      disabled: true,
      options: [{ name: 'Normalize', value: 'normalize_landmarks_points' }],
      validators: [Validators.required],
      tooltip: {
        prefix: 'accuracyParams',
        value: 'normalize_landmarks_points',
      },
    },
  };

  readonly group = new FormGroup({
    normalize_landmarks_points: createControl(this._fields.normalize_landmarks_points),
  });

  orderedFields: { field: AdvancedConfigField; group: FormGroup }[] = [
    { field: this._fields.normalize_landmarks_points, group: this.group },
  ];

  setValue(_: INormalizeLandmarkPointsPostProcessor) {}

  getValue(): INormalizeLandmarkPointsPostProcessor {
    return { type: PostProcessorType.NORMALIZE_LANDMARKS_POINTS };
  }

  destroy() {}
}
