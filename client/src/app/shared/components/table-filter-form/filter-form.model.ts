import { MatLegacyTableDataSource as MatTableDataSource } from '@angular/material/legacy-table';

import { Dictionary } from '@ngrx/entity';
import { eq, gt, gte, lt, lte, negate } from 'lodash';

export interface ValueConditionOption {
  name: string;
  value: ValueConditionOptionsEnum;
}

export enum ValueConditionOptionsEnum {
  EQUALS = 'eq',
  EQUALS_NA = 'equals_na',
  EQUALS_NOT_EXECUTED = 'equals_not_executed',
  NOT_EQUAL = 'neq',
  LT = 'lt',
  LTE = 'lte',
  GT = 'gt',
  GTE = 'gte',
}

export const numberValueConditionToFunctionMap = {
  [ValueConditionOptionsEnum.EQUALS]: eq,
  [ValueConditionOptionsEnum.NOT_EQUAL]: negate(eq),
  [ValueConditionOptionsEnum.LT]: lt,
  [ValueConditionOptionsEnum.LTE]: lte,
  [ValueConditionOptionsEnum.GT]: gt,
  [ValueConditionOptionsEnum.GTE]: gte,
};

export const numberValueConditionsMap = {
  [ValueConditionOptionsEnum.EQUALS]: {
    name: 'Equals',
    value: ValueConditionOptionsEnum.EQUALS,
  },
  [ValueConditionOptionsEnum.NOT_EQUAL]: {
    name: 'Not equal',
    value: ValueConditionOptionsEnum.NOT_EQUAL,
  },
  [ValueConditionOptionsEnum.LT]: {
    name: 'Less than',
    value: ValueConditionOptionsEnum.LT,
  },
  [ValueConditionOptionsEnum.LTE]: {
    name: 'Less than or equals',
    value: ValueConditionOptionsEnum.LTE,
  },
  [ValueConditionOptionsEnum.GT]: {
    name: 'Greater than',
    value: ValueConditionOptionsEnum.GT,
  },
  [ValueConditionOptionsEnum.GTE]: {
    name: 'Greater than or equals',
    value: ValueConditionOptionsEnum.GTE,
  },
};

// TODO Add like filter type
export type FilterType = 'number' | 'set' | 'time';

export interface FilterableColumn {
  type: FilterType;
  name: string;
  label: string;
}

export class FilterableColumnOption {
  value: string;
  name: string;

  constructor(value: string, ...args) {
    const [name] = args;
    this.value = value;
    this.name = name || value;
  }
}

export type FilterableColumnOptions = Dictionary<FilterableColumnOption[]>;

export interface AppliedFilter {
  filters: {
    column: string;
    value: string[] | number | string;
    valueCondition?: ValueConditionOptionsEnum;
  }[];
}

export type IMatTableDataSource<T> = Omit<MatTableDataSource<T>, 'filter' | 'filterPredicate'> & {
  filter: string | AppliedFilter | null;
  filterPredicate: (data: T, appliedFilter: string | AppliedFilter | null) => boolean;
};
