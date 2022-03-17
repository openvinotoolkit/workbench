import { createAction, props } from '@ngrx/store';

import { ILabelSet, ITestImage } from '@store/inference-test-image-store/inference-test-image-models';

import { IInferenceTestImagePipeline } from '@shared/models/pipelines/inference-test-image-pipeline';
import { IVisualizationConfiguration } from '@shared/models/accuracy';

import { VisualizationType } from '../../modules/accuracy/components/visualization/network-output/original-image-controls/original-image-controls.component';

// INFERENCE

export const testImage = createAction(
  '[Accuracy] Test image',
  props<{
    file: File;
    mask?: File;
    modelId: number;
    deviceId: number;
    visualizationConfig?: IVisualizationConfiguration;
    visualizationType: VisualizationType;
    early: boolean;
  }>()
);

export const testImageSuccess = createAction(
  '[Accuracy] Test image success',
  props<{ data: IInferenceTestImagePipeline }>()
);

export const testImageFailure = createAction('[Accuracy] Test image failure', props<{ error: string }>());

export const onImageInferenceSocketMessage = createAction(
  '[Accuracy] On image inference socket message',
  props<{ message: IInferenceTestImagePipeline }>()
);

export const upsertInferencePipelines = createAction(
  '[Accuracy] Upsert inference pipelines',
  props<{ data: [IInferenceTestImagePipeline] }>()
);

export const removeInferencePipeline = createAction('[Accuracy] Remove inference pipeline', props<{ id: number }>());

export const cancelInferencePipeline = createAction('[Accuracy] Cancel inference pipeline');

// TEST IMAGE

export const setTestImage = createAction('[Accuracy] Set test image', props<{ data: ITestImage }>());

// LABEL SET

export const loadLabelSets = createAction('[Accuracy] Load label sets');
export const loadLabelSetsSuccess = createAction('[Accuracy] Load label sets success', props<{ data: ILabelSet[] }>());
export const loadLabelSetsFailure = createAction('[Accuracy] Load label sets failure', props<{ error: string }>());

// RESET STATE

export const resetAccuracyState = createAction('[Accuracy] Reset state');
export const resetTestImage = createAction('[Accuracy] Reset test image');

// GOOGLE ANALYTICS

export const reportTestInferenceGA = createAction(
  '[Accuracy] Report Test Inference GA',
  props<{ modelId: number; testImage: ITestImage }>()
);
