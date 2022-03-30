import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ModelDownloaderDTO } from '@shared/models/dto/model-downloader-dto';

import { BaseModelZooDataSource, IModelZooSort } from './base-model-zoo-data-source';

export interface IOpenModelZooFilter {
  name: string;
  filters: Record<keyof ModelDownloaderDTO, string[]>;
}

interface IOpenModelZooFiltersOptions {
  taskType: string[];
  precision: string[];
  framework: string[];
}

export class OpenModelZooDataSource extends BaseModelZooDataSource<ModelDownloaderDTO, IOpenModelZooFilter> {
  readonly sortOptions: IModelZooSort<ModelDownloaderDTO>[] = [
    { field: 'name', direction: 'asc', label: 'Name (A-Z)' },
    { field: 'name', direction: 'desc', label: 'Name (Z-A)' },
  ];

  filtersOptions$: Observable<IOpenModelZooFiltersOptions> = this._data$.pipe(
    map(() => ({
      taskType: this._getFilterOptionsByKey('task_type'),
      precision: this._getFilterOptionsByKey('precision'),
      framework: this._getFilterOptionsByKey('framework'),
    }))
  );

  private _getFilterOptionsByKey(key: keyof ModelDownloaderDTO): string[] {
    const availableOptions = this.data?.reduce((acc, item) => {
      const fieldValue = item[key];
      if (Array.isArray(fieldValue)) {
        acc.push(...fieldValue.flat());
      } else {
        acc.push(fieldValue);
      }
      return acc;
    }, []);
    return Array.from(new Set(availableOptions));
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
