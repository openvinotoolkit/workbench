export interface IHuggingfaceModelConfig {
  modelType?: string;
  architectures?: string[];
}

interface IHuggingfaceModelValidationResult {
  disabled: boolean;
  message?: string;
}

export interface IHuggingfaceModel {
  id: string;
  pipelineTag: string;
  lastModified: string;
  tags: string[];
  validation: IHuggingfaceModelValidationResult;
  siblings?: string[];
  config?: IHuggingfaceModelConfig;
  downloads?: number;
}
