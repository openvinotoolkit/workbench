import { UntypedFormGroup } from '@angular/forms';

import {
  ModelItem,
  ModelTaskMethods,
  ModelTaskTypes,
  TaskMethodToNameMap,
  TaskMethodToTypeMap,
  TaskTypeToNameMap,
} from '@store/model-store/model.model';
import { DatasetTypes } from '@store/dataset-store/dataset.model';

import { IAdapter } from '@shared/models/accuracy/adapter';
import { IPreProcessor } from '@shared/models/accuracy/pre-processor';
import { IPostProcessor } from '@shared/models/accuracy/post-processor';
import { IMetric } from '@shared/models/accuracy/metric';
import { IAnnotationConversion } from '@shared/models/accuracy/annotation-conversion';
import { AdvancedConfigField } from '@shared/components/config-form-field/config-form-field.component';
import { IAccuracyConfiguration } from '@shared/models/accuracy';

import { PreProcessorGroupHandler } from './pre-processor-handler';
import { AdapterGroupHandler } from './adapter-handler';
import { PostProcessorGroupHandler } from './post-processor-handler';
import { MetricGroupHandler } from './metric-handler';
import { AnnotationConversionGroupHandler } from './annotation-conversion-handler';
import { createControl, Subscriptions } from './index';

const SUPPORTED_TASK_METHODS = {
  [ModelTaskTypes.CLASSIFICATION]: [
    { name: TaskMethodToNameMap[ModelTaskMethods.CLASSIFICATOR], value: ModelTaskMethods.CLASSIFICATOR },
  ],
  [ModelTaskTypes.OBJECT_DETECTION]: [
    { name: TaskMethodToNameMap[ModelTaskMethods.SSD], value: ModelTaskMethods.SSD },
    { name: TaskMethodToNameMap[ModelTaskMethods.YOLO_V2], value: ModelTaskMethods.YOLO_V2 },
    { name: TaskMethodToNameMap[ModelTaskMethods.TINY_YOLO_V2], value: ModelTaskMethods.TINY_YOLO_V2 },
    { name: TaskMethodToNameMap[ModelTaskMethods.YOLO_V3], value: ModelTaskMethods.YOLO_V3 },
    { name: TaskMethodToNameMap[ModelTaskMethods.YOLO_V4], value: ModelTaskMethods.YOLO_V4 },
    { name: TaskMethodToNameMap[ModelTaskMethods.TINY_YOLO_V3_V4], value: ModelTaskMethods.TINY_YOLO_V3_V4 },
  ],
  [ModelTaskTypes.SEMANTIC_SEGMENTATION]: [
    {
      name: TaskMethodToNameMap[ModelTaskMethods.SEMANTIC_SEGMENTATION],
      value: ModelTaskMethods.SEMANTIC_SEGMENTATION,
    },
  ],
  [ModelTaskTypes.INSTANCE_SEGMENTATION]: [
    {
      name: TaskMethodToNameMap[ModelTaskMethods.MASK_RCNN_SEGMENTATION],
      value: ModelTaskMethods.MASK_RCNN_SEGMENTATION,
    },
  ],
  [ModelTaskTypes.INPAINTING]: [
    { name: TaskMethodToNameMap[ModelTaskMethods.INPAINTING], value: ModelTaskMethods.INPAINTING },
  ],
  [ModelTaskTypes.STYLE_TRANSFER]: [
    { name: TaskMethodToNameMap[ModelTaskMethods.STYLE_TRANSFER], value: ModelTaskMethods.STYLE_TRANSFER },
  ],
  [ModelTaskTypes.SUPER_RESOLUTION]: [
    { name: TaskMethodToNameMap[ModelTaskMethods.SUPER_RESOLUTION], value: ModelTaskMethods.SUPER_RESOLUTION },
  ],
  [ModelTaskTypes.LANDMARK_DETECTION]: [
    { name: TaskMethodToNameMap[ModelTaskTypes.LANDMARK_DETECTION], value: ModelTaskMethods.LANDMARK_DETECTION },
  ],
  [ModelTaskTypes.FACE_RECOGNITION]: [
    { name: TaskMethodToNameMap[ModelTaskTypes.FACE_RECOGNITION], value: ModelTaskMethods.FACE_RECOGNITION },
  ],
  [ModelTaskTypes.GENERIC]: [{ name: TaskMethodToNameMap[ModelTaskMethods.GENERIC], value: ModelTaskMethods.GENERIC }],
};

export class BasicAccuracyValidationFormHandler {
  readonly fields: { taskType: AdvancedConfigField; taskMethod: AdvancedConfigField } = {
    taskType: {
      type: 'select',
      label: 'Usage',
      name: 'taskType',
      options: [
        { value: ModelTaskTypes.CLASSIFICATION, name: TaskTypeToNameMap[ModelTaskTypes.CLASSIFICATION] },
        { value: ModelTaskTypes.OBJECT_DETECTION, name: TaskTypeToNameMap[ModelTaskTypes.OBJECT_DETECTION] },
        { value: ModelTaskTypes.GENERIC, name: TaskTypeToNameMap[ModelTaskTypes.GENERIC] },
        { value: ModelTaskTypes.INSTANCE_SEGMENTATION, name: TaskTypeToNameMap[ModelTaskTypes.INSTANCE_SEGMENTATION] },
        { value: ModelTaskTypes.SEMANTIC_SEGMENTATION, name: TaskTypeToNameMap[ModelTaskTypes.SEMANTIC_SEGMENTATION] },
        { value: ModelTaskTypes.INPAINTING, name: TaskTypeToNameMap[ModelTaskTypes.INPAINTING] },
        { value: ModelTaskTypes.STYLE_TRANSFER, name: TaskTypeToNameMap[ModelTaskTypes.STYLE_TRANSFER] },
        { value: ModelTaskTypes.SUPER_RESOLUTION, name: TaskTypeToNameMap[ModelTaskTypes.SUPER_RESOLUTION] },
        { value: ModelTaskTypes.LANDMARK_DETECTION, name: TaskTypeToNameMap[ModelTaskTypes.LANDMARK_DETECTION] },
        { value: ModelTaskTypes.FACE_RECOGNITION, name: TaskTypeToNameMap[ModelTaskTypes.FACE_RECOGNITION] },
      ],
      tooltip: {
        prefix: 'uploadFilePage',
        value: 'modelTask',
      },
    },
    taskMethod: {
      type: 'select',
      label: 'Model Type',
      name: 'taskMethod',
      options: [],
      tooltip: {
        prefix: 'uploadFilePage',
        value: 'modelMethod',
      },
    },
  };

  adapterGroup: AdapterGroupHandler;
  preprocessorGroup: PreProcessorGroupHandler;
  postprocessorGroup: PostProcessorGroupHandler;
  metricGroup: MetricGroupHandler;
  annotationConversionGroup: AnnotationConversionGroupHandler;

  form = new UntypedFormGroup({
    taskType: createControl(this.fields.taskType),
    taskMethod: createControl(this.fields.taskMethod),
  });

  private readonly _subs = new Subscriptions();

  constructor(datasetType: DatasetTypes, model: ModelItem, taskType: ModelTaskTypes, taskMethod: ModelTaskMethods) {
    if (taskMethod === ModelTaskMethods.GENERIC && model.analysis.topologyType) {
      const modelTask = TaskMethodToTypeMap[model.analysis.topologyType];
      let modelMethod = model.analysis.topologyType;
      if (modelMethod === ModelTaskMethods.GENERIC_YOLO) {
        modelMethod = ModelTaskMethods.TINY_YOLO_V2;
      }
      this.form.controls.taskType.patchValue(modelTask);
      this.form.controls.taskMethod.patchValue(modelMethod);
    } else {
      this.form.controls.taskType.patchValue(taskType);
      this.form.controls.taskMethod.patchValue(taskMethod);
    }

    this.fields.taskMethod.options = SUPPORTED_TASK_METHODS[this.form.controls.taskType.value];

    this._subs.add = this.form.controls.taskType.valueChanges.subscribe((task: ModelTaskTypes) => {
      const availableMethods = SUPPORTED_TASK_METHODS[task];
      this.fields.taskMethod.options = availableMethods;
      this.form.controls.taskMethod.setValue(availableMethods[0].value);
    });

    this._subs.add = this.form.controls.taskMethod.valueChanges.subscribe(() => this._buildGroups(datasetType, model));

    this._buildGroups(datasetType, model);
  }

  protected _buildGroups(datasetType: DatasetTypes, model: ModelItem) {
    const taskType: ModelTaskTypes = this.form.controls.taskType.value;
    const taskMethod: ModelTaskMethods = this.form.controls.taskMethod.value;

    this._destroyGroups();

    if (taskType === ModelTaskTypes.GENERIC) {
      return;
    }

    if (AdapterGroupHandler.isApplicable(taskMethod)) {
      this.adapterGroup = new AdapterGroupHandler(taskType, taskMethod, model, model.accuracyConfiguration);
      this.form.addControl('adapterConfiguration', this.adapterGroup.group);
    }

    if (PreProcessorGroupHandler.isApplicable()) {
      this.preprocessorGroup = new PreProcessorGroupHandler(taskType, model);
      this.form.addControl('preprocessing', this.preprocessorGroup.group);
    }

    if (PostProcessorGroupHandler.isApplicable(taskType)) {
      this.postprocessorGroup = new PostProcessorGroupHandler(taskType, taskMethod, model.accuracyConfiguration);
      this.form.addControl('postprocessing', this.postprocessorGroup.group);
    }

    if (MetricGroupHandler.isApplicable()) {
      this.metricGroup = new MetricGroupHandler(taskType, model);
      this.form.addControl('metric', this.metricGroup.group);
    }

    if (AnnotationConversionGroupHandler.isApplicable(taskType, datasetType)) {
      this.annotationConversionGroup = new AnnotationConversionGroupHandler(datasetType, model);
      this.form.addControl('annotationConversion', this.annotationConversionGroup.group);
    }
  }

  getValue(): IAccuracyConfiguration {
    return {
      taskType: this.form.value.taskType,
      taskMethod: this.form.value.taskMethod,
      adapterConfiguration: this.adapterGroup?.getValue() || ({} as IAdapter),
      preprocessing: this.preprocessorGroup?.getValue() || ([] as IPreProcessor[]),
      postprocessing: this.postprocessorGroup?.getValue() || ([] as IPostProcessor[]),
      metric: this.metricGroup?.getValue() || ([] as IMetric[]),
      annotationConversion: this.annotationConversionGroup?.getValue() || ({} as IAnnotationConversion),
    };
  }

  destroy() {
    this._subs.unsubscribe();
    this._destroyGroups();
  }

  protected _destroyGroups() {
    this.adapterGroup?.destroy?.();
    this.adapterGroup = null;
    this.form.removeControl('adapterConfiguration');
    this.preprocessorGroup?.destroy?.();
    this.preprocessorGroup = null;
    this.form.removeControl('preprocessing');
    this.postprocessorGroup?.destroy?.();
    this.postprocessorGroup = null;
    this.form.removeControl('postprocessing');
    this.metricGroup?.destroy?.();
    this.metricGroup = null;
    this.form.removeControl('metric');
    this.annotationConversionGroup?.destroy?.();
    this.annotationConversionGroup = null;
    this.form.removeControl('annotationConversion');
  }
}
