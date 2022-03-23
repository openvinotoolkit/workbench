import { ModelDownloaderDTO } from '@shared/models/dto/model-downloader-dto';

import { BaseModelZooDataSource, IModelZooSort } from './base-model-zoo-data-source';

interface IOpenModelZooFilter {
  name: string;
  filters: Record<keyof Partial<ModelDownloaderDTO>, string[]>;
}

export class OpenModelZooDataSource extends BaseModelZooDataSource<ModelDownloaderDTO, IOpenModelZooFilter> {
  sortOptions: IModelZooSort<ModelDownloaderDTO>[] = [
    { field: 'name', direction: 'asc', label: 'Name (A-Z)' },
    { field: 'name', direction: 'desc', label: 'Name (Z-A)' },
  ];

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
