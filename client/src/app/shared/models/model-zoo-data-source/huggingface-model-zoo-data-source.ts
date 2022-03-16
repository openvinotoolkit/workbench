import { IHuggingfaceModel } from '@shared/models/huggingface/huggingface-model';

import { BaseModelZooDataSource, ModelZooSort } from './base-model-zoo-data-source';

export class HuggingfaceModelZooDataSource extends BaseModelZooDataSource<IHuggingfaceModel> {
  protected _searchIdentityField: keyof IHuggingfaceModel = 'id';

  sortOptions: ModelZooSort<IHuggingfaceModel>[] = [
    { field: 'downloads', direction: 'desc', label: 'Most Downloaded' },
    { field: 'lastModified', direction: 'desc', label: 'Recently Updated' },
    { field: 'id', direction: 'asc', label: 'Name (A-Z)' },
    { field: 'id', direction: 'desc', label: 'Name (Z-A)' },
  ];

  // todo: filter on data set
  set filterTags(value: string[]) {
    this._matDataSource.data = this._filterTags(this._originalData.slice(), value);
    this._matDataSource.paginator.firstPage();
  }

  private _filterTags(data: IHuggingfaceModel[], tags: string[]): IHuggingfaceModel[] {
    return data.filter((model) => {
      return tags.every((tag) => model.tags.indexOf(tag) !== -1);
    });
  }
}
