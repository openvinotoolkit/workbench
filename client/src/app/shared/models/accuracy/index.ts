import { ModelTaskMethods, ModelTaskTypes } from '@store/model-store/model.model';

import { IAdapter } from '@shared/models/accuracy/adapter';
import { IAnnotationConversion } from '@shared/models/accuracy/annotation-conversion';
import { IPreProcessor } from '@shared/models/accuracy/pre-processor';
import { IPostProcessor } from '@shared/models/accuracy/post-processor';
import { IMetric } from '@shared/models/accuracy/metric';

export interface IAccuracyConfiguration {
  taskType: ModelTaskTypes;
  taskMethod: ModelTaskMethods;
  adapterConfiguration: IAdapter;
  annotationConversion: IAnnotationConversion;
  preprocessing: IPreProcessor[];
  postprocessing: IPostProcessor[];
  metric: IMetric[];
}

export interface IVisualizationConfiguration {
  taskType: ModelTaskTypes;
  taskMethod: ModelTaskMethods;
  adapterConfiguration: IAdapter;
  preprocessing: IPreProcessor[];
  postprocessing: IPostProcessor[];
}
