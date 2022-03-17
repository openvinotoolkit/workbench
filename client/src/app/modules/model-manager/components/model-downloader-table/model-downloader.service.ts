import { Injectable } from '@angular/core';

import { every, includes, isArray, isEmpty, isString, map, toLower } from 'lodash';

import { modelFrameworkNamesMap, OMZColumnNames, TaskTypeToNameMap } from '@store/model-store/model.model';

import { ModelDownloaderDTO } from '@shared/models/dto/model-downloader-dto';
import {
  AppliedFilter,
  FilterableColumnOption,
  FilterableColumnOptions,
} from '@shared/components/table-filter-form/filter-form.model';

@Injectable()
export class ModelDownloaderService {
  private static readonly separator = ',';

  public filterableColumnOptions: FilterableColumnOptions = {
    [OMZColumnNames.MODEL_NAME]: [],
    [OMZColumnNames.PRECISION]: [],
    [OMZColumnNames.FRAMEWORK]: [],
    [OMZColumnNames.TASK_TYPE]: [],
  };

  static tableDataAccessor(data: ModelDownloaderDTO, sortHeaderId: string): string {
    if (OMZColumnNames.TASK_TYPE === sortHeaderId) {
      return data.task_type;
    }
    if (OMZColumnNames.PRECISION === sortHeaderId) {
      return [...data.precision].join(ModelDownloaderService.separator);
    }
    const value = data[sortHeaderId];
    if (isString(value)) {
      return toLower(value);
    }
    return isArray(value) ? value[0] : value;
  }

  public customFilterPredicate(data: ModelDownloaderDTO, appliedFilter: AppliedFilter): boolean {
    if (!appliedFilter) {
      return true;
    }
    const { filters } = appliedFilter;
    return every(filters, ({ column, value }) => {
      const filteredParam = ModelDownloaderService.tableDataAccessor(data, column);
      if (column === OMZColumnNames.PRECISION) {
        const precisions = filteredParam.split(ModelDownloaderService.separator);
        return !isEmpty((value as string[]).filter((v) => precisions.includes(v)));
      }
      return includes(value as string[], filteredParam);
    });
  }

  private getFilterableColumnOptionFromModels(
    models: ModelDownloaderDTO[],
    option: OMZColumnNames
  ): FilterableColumnOption[] {
    return models.reduce((acc, model) => {
      const value = ModelDownloaderService.tableDataAccessor(model, option);
      if (option === OMZColumnNames.MODEL_NAME) {
        acc.push(new FilterableColumnOption(value as string, model.name));
      }
      if ([OMZColumnNames.FRAMEWORK, OMZColumnNames.TASK_TYPE].includes(option) && !map(acc, 'value').includes(value)) {
        const filterableColumnOptionName =
          option === OMZColumnNames.FRAMEWORK
            ? modelFrameworkNamesMap[model.framework]
            : TaskTypeToNameMap[model.task_type];
        acc.push(new FilterableColumnOption(value as string, filterableColumnOptionName));
      }
      if (option === OMZColumnNames.PRECISION) {
        const precisions = value.split(ModelDownloaderService.separator);
        precisions.forEach((precision, index) => {
          if (!map(acc, 'value').includes(precision)) {
            acc.push(new FilterableColumnOption(precisions[index], precision));
          }
        });
      }
      return acc;
    }, []);
  }

  public setUpFilterableColumnOptions(models: ModelDownloaderDTO[]): void {
    if (isEmpty(models)) {
      return;
    }

    Object.values(OMZColumnNames).forEach((columnName: OMZColumnNames) => {
      this.filterableColumnOptions[columnName] = this.getFilterableColumnOptionFromModels(models, columnName);
    });
  }
}
