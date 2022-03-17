import { DatasetTypes } from '@store/dataset-store/dataset.model';
import { ModelItem, ModelTaskMethods, ModelTaskTypes } from '@store/model-store/model.model';

import { IVisualizationConfiguration } from '@shared/models/accuracy';
import { IAdapter } from '@shared/models/accuracy/adapter';
import { IPreProcessor } from '@shared/models/accuracy/pre-processor';
import { IPostProcessor } from '@shared/models/accuracy/post-processor';

import { BasicAccuracyValidationFormHandler } from './basic-accuracy-validation-form-handler';
import { AdapterGroupHandler } from './adapter-handler';
import { PreProcessorGroupHandler } from './pre-processor-handler';
import { PostProcessorGroupHandler } from './post-processor-handler';

export class VisualizationFormHandler extends BasicAccuracyValidationFormHandler {
  constructor(model: ModelItem) {
    super(null, model, model.visualizationConfiguration.taskType, model.visualizationConfiguration.taskMethod);
  }

  protected _buildGroups(_: DatasetTypes, model: ModelItem) {
    const taskType: ModelTaskTypes = this.form.controls.taskType.value;
    const taskMethod: ModelTaskMethods = this.form.controls.taskMethod.value;

    this._destroyGroups();

    if (taskType === ModelTaskTypes.GENERIC) {
      return;
    }

    if (AdapterGroupHandler.isApplicable(taskMethod)) {
      this.adapterGroup = new AdapterGroupHandler(taskType, taskMethod, model, model.visualizationConfiguration);
      this.form.addControl('adapterConfiguration', this.adapterGroup.group);
    }

    if (PreProcessorGroupHandler.isApplicable()) {
      this.preprocessorGroup = new PreProcessorGroupHandler(taskType, model, true);
      this.form.addControl('preprocessing', this.preprocessorGroup.group);
    }

    if (PostProcessorGroupHandler.isApplicable(taskType)) {
      this.postprocessorGroup = new PostProcessorGroupHandler(taskType, taskMethod, model.visualizationConfiguration);
      this.form.addControl('postprocessing', this.postprocessorGroup.group);
    }
  }

  getVisualizationConfiguration(): IVisualizationConfiguration {
    return {
      taskType: this.form.value.taskType,
      taskMethod: this.form.value.taskMethod,
      adapterConfiguration: this.adapterGroup?.getValue() || ({} as IAdapter),
      preprocessing: this.preprocessorGroup?.getValue() || ([] as IPreProcessor[]),
      postprocessing: this.postprocessorGroup?.getValue() || ([] as IPostProcessor[]),
    };
  }
}
