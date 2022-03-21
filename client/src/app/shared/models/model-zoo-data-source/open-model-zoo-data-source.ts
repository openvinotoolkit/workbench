import { ModelDownloaderDTO } from '@shared/models/dto/model-downloader-dto';

import { BaseModelZooDataSource, ModelZooSort } from './base-model-zoo-data-source';

export class OpenModelZooDataSource extends BaseModelZooDataSource<ModelDownloaderDTO> {
  protected _searchIdentityField: keyof ModelDownloaderDTO = 'name';

  sortOptions: ModelZooSort<ModelDownloaderDTO>[] = [
    { field: 'name', direction: 'asc', label: 'Name (A-Z)' },
    { field: 'name', direction: 'desc', label: 'Name (Z-A)' },
  ];

  set appliedFilters(filters: Record<keyof ModelDownloaderDTO, string[]>) {
    this._matDataSource.data = this._getFilteredData(this._originalData.slice(), filters);
    this._matDataSource.paginator.firstPage();
  }

  private _getFilteredData(
    data: ModelDownloaderDTO[],
    filters: Record<keyof ModelDownloaderDTO, string[]>
  ): ModelDownloaderDTO[] {
    const notEmptyFilters = Object.entries(filters).filter(([, value]) => value.length);
    if (!notEmptyFilters.length) {
      return data.slice();
    }
    return data.filter((model) => {
      return notEmptyFilters.every(([key, value]) => {
        const modelValue = model[key];
        if (Array.isArray(modelValue)) {
          return value.every((v) => modelValue.includes(v));
        }
        return value.includes(modelValue);
      });
    });
  }
}
