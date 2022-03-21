import { IHuggingfaceModel } from '@shared/models/huggingface/huggingface-model';

import { BaseModelZooDataSource } from './base-model-zoo-data-source';

interface IHuggingfaceModelZooFilter {
  id: string;
  tags: string[];
}

export class HuggingfaceModelZooDataSource extends BaseModelZooDataSource<
  IHuggingfaceModel,
  IHuggingfaceModelZooFilter
> {
  filterPredicate(data: IHuggingfaceModel, { id, tags }: { id: string; tags: string[] }): boolean {
    const idMatched = data.id.toLowerCase().includes(id.trim().toLowerCase());
    const tagsMatched = tags.every((tag) => data.tags.indexOf(tag) !== -1);
    return idMatched && tagsMatched;
  }
}
