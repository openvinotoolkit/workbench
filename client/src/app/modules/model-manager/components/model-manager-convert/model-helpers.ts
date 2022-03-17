import { ModelFrameworks, ModelItem, ModelSources } from '@store/model-store/model.model';

export function isOriginalModel(model: ModelItem): boolean {
  return model?.modelSource === ModelSources.ORIGINAL;
}

export function isHuggingfaceModel(model: ModelItem): boolean {
  return model?.modelSource === ModelSources.HUGGINGFACE;
}

export function isOMZModel(model): boolean {
  return model?.modelSource === ModelSources.OMZ;
}

export function isTfModel(model: ModelItem): boolean {
  return isOriginalModel(model) && model.originalModelFramework === ModelFrameworks.TF;
}

export function isTFObjectDetectionAPI(model: ModelItem): boolean {
  return isOriginalModel(model) && isTfModel(model) && Boolean(model?.mo?.analyzedParams?.model_type?.TF_OD_API);
}
