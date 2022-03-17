import { ITestImage } from '@store/inference-test-image-store/inference-test-image-models';

import { IJob, IPipeline, JobType, PipelineType } from '@shared/models/pipelines/pipeline';

export interface IInferenceTestImageJob extends IJob {
  type: JobType.inference_test_image;
  modelId: number;
  // TODO Consider adding task method
  optimizedFromModelId: number;
  testImage: ITestImage;
}

export interface IInferenceTestImagePipeline extends IPipeline {
  type: PipelineType.INFERENCE_TEST_IMAGE;
  jobs: [IInferenceTestImageJob];
}
