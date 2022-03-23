import { IHuggingfaceModel } from '@shared/models/huggingface/huggingface-model';

import { BaseModelZooDataSource, IModelZooSort } from './base-model-zoo-data-source';

interface IHuggingfaceModelZooFilter {
  id: string;
  tags: string[];
}

export class HuggingfaceModelZooDataSource extends BaseModelZooDataSource<
  IHuggingfaceModel,
  IHuggingfaceModelZooFilter
> {
  sortOptions: IModelZooSort<IHuggingfaceModel>[] = [
    { field: 'downloads', direction: 'desc', label: 'Most Downloaded' },
    { field: 'lastModified', direction: 'desc', label: 'Recently Updated' },
    { field: 'id', direction: 'asc', label: 'Name (A-Z)' },
    { field: 'id', direction: 'desc', label: 'Name (Z-A)' },
  ];

  filterPredicate(data: IHuggingfaceModel, { id, tags }: IHuggingfaceModelZooFilter): boolean {
    const isIdMatched = data.id.toLowerCase().includes(id.trim().toLowerCase());
    const areTagsMatched = tags.every((tag) => data.tags.indexOf(tag) !== -1);
    return isIdMatched && areTagsMatched;
  }
}
