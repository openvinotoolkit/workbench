import { ModelDownloaderDTO } from '@shared/models/dto/model-downloader-dto';

import { BaseModelZooDataSource, ModelZooSort } from './base-model-zoo-data-source';

interface IOpenModelZooFilter {
  name: string;
  // filters: Pick<ModelDownloaderDTO, 'task_type' | 'precision' | 'framework'>;
  // filters: Record<'task_type' | 'precision' | 'framework', string[]>;
  filters: Record<keyof Partial<ModelDownloaderDTO>, string[]>;
  // filters: {
  //   [key in keyof Partial<ModelDownloaderDTO>]: string[];
  // };
}

export class OpenModelZooDataSource extends BaseModelZooDataSource<ModelDownloaderDTO, IOpenModelZooFilter> {
  // protected _searchIdentityField: keyof ModelDownloaderDTO = 'name';

  sortOptions: ModelZooSort<ModelDownloaderDTO>[] = [
    { field: 'name', direction: 'asc', label: 'Name (A-Z)' },
    { field: 'name', direction: 'desc', label: 'Name (Z-A)' },
  ];

  // set appliedFilters(filters: Record<keyof ModelDownloaderDTO, string[]>) {
  //   this._matDataSource.data = this._getFilteredData(this._originalData.slice(), filters);
  //   this._matDataSource.paginator.firstPage();
  // }

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

  filterPredicate(data: ModelDownloaderDTO, { name, filters }: IOpenModelZooFilter): boolean {
    const isNameMatched = data.name.toLowerCase().includes(name.trim().toLowerCase());

    const notEmptyFilters = Object.entries(filters).filter(([, value]) => value.length);

    if (!notEmptyFilters.length) {
      return isNameMatched;
    }

    const areFiltersMatched = notEmptyFilters.every(([key, value]) => {
      const modelValue = data[key];
      if (Array.isArray(modelValue)) {
        return value.every((v) => modelValue.includes(v));
      }
      return value.includes(modelValue);
    });

    return isNameMatched && areFiltersMatched;
  }
}
