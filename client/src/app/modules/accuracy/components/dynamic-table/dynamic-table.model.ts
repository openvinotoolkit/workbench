import { FilterableColumn, FilterType } from '@shared/components/table-filter-form/filter-form.model';

export interface IDynamicTableColumnOptions {
  transform?: (value: string | number) => string;
  filter?: FilterType;
}

export class DynamicTableColumn {
  readonly name: string;
  header: string;
  readonly options: IDynamicTableColumnOptions;

  get filterColumn(): FilterableColumn {
    if (!this.options?.filter) {
      return null;
    }

    return {
      name: this.name,
      label: this.header,
      type: this.options.filter,
    };
  }

  constructor(name: string, header: string, options?: IDynamicTableColumnOptions) {
    this.name = name;
    this.header = header;
    this.options = options;
  }
}
