import { IHuggingfaceModel } from '@shared/models/huggingface/huggingface-model';

import { BaseModelZooDataSource } from './base-model-zoo-data-source';

export class HuggingfaceModelZooDataSource extends BaseModelZooDataSource<IHuggingfaceModel> {
  protected _searchIdentityField: keyof IHuggingfaceModel = 'id';

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
