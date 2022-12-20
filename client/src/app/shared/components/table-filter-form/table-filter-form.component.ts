import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
} from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';

import { filter, find, get } from 'lodash';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import {
  AppliedFilter,
  FilterableColumn,
  FilterableColumnOption,
  FilterableColumnOptions,
  FilterType,
  ValueConditionOption,
  ValueConditionOptionsEnum,
} from './filter-form.model';

@Component({
  selector: 'wb-table-filter-form',
  templateUrl: './table-filter-form.component.html',
  styleUrls: ['./table-filter-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableFilterFormComponent implements OnDestroy {
  @Input()
  public columns: FilterableColumn[] = [];

  @Input()
  public columnOptions: FilterableColumnOptions;

  @Input()
  public valueConditionOptions: ValueConditionOption[];

  private _disabled = false;
  @Input()
  public set disabled(value: boolean) {
    this._disabled = value;
    this._disabled ? this.mainFormGroup.disable({ emitEvent: false }) : this.mainFormGroup.enable({ emitEvent: false });
  }

  public get disabled(): boolean {
    return this._disabled;
  }

  @Output()
  public resetFilter: EventEmitter<void> = new EventEmitter<void>();

  @Output()
  public applyFilter: EventEmitter<AppliedFilter> = new EventEmitter<AppliedFilter>();

  public isFilterApplied = false;

  public labels = {
    selectColumn: 'Select Column',
    selectFilter: 'Select Filter',
    enterValue: 'Enter Value',
  };

  public controlNamesMap = {
    filters: 'filters',
    column: 'column',
    value: 'value',
    valueCondition: 'valueCondition',
  };

  public mainFormGroup: UntypedFormGroup;

  private unsubscribe$: Subject<void> = new Subject<void>();

  constructor(private fb: UntypedFormBuilder, private _cdr: ChangeDetectorRef) {
    this.createForm();
  }

  get filtersFormArray(): UntypedFormArray {
    return <UntypedFormArray>this.mainFormGroup.get(this.controlNamesMap.filters);
  }

  public appliedFilter: AppliedFilter = null;

  getAvailableColumnsToFilter(index: number): FilterableColumn[] {
    return this.columns?.filter(({ name }) => {
      const selectedColumnNames = this.filtersFormArray.controls.map(
        (control) => control.get(this.controlNamesMap.column).value as string
      );
      const currentColumnName = this.filtersFormArray.at(index).get(this.controlNamesMap.column).value;
      return name === currentColumnName || !selectedColumnNames.includes(name);
    });
  }

  reset() {
    this.createForm();
    this.mainFormGroup.markAsPristine();
    this.mainFormGroup.markAsUntouched();
    this.isFilterApplied = false;
    this.appliedFilter = null;
    this._cdr.detectChanges();
  }

  onApplyFilter(): void {
    this.appliedFilter = this.mainFormGroup.value;
    this.applyFilter.emit(this.mainFormGroup.value);
    this.isFilterApplied = true;
    this.mainFormGroup.disable({ emitEvent: false });
  }

  onResetFilter(): void {
    this.appliedFilter = null;
    this.resetFilter.emit();
    this.isFilterApplied = false;
    this.mainFormGroup.enable({ emitEvent: false });
  }

  createForm() {
    this.mainFormGroup = this.fb.group({
      filters: this.fb.array([this.createFilterGroup()]),
    });
  }

  createFilterGroup(): UntypedFormGroup {
    const group = this.fb.group({
      column: [null, Validators.required],
      value: [null, Validators.required],
    });
    group.get(this.controlNamesMap.value).disable();
    group
      .get(this.controlNamesMap.column)
      .valueChanges.pipe(takeUntil(this.unsubscribe$))
      .subscribe((columnName) => {
        if (!columnName) {
          return;
        }
        group.get(this.controlNamesMap.value).enable();
        group.get(this.controlNamesMap.value).setValue(null);

        if (group.get(this.controlNamesMap.valueCondition)) {
          group.removeControl(this.controlNamesMap.valueCondition);
        }
        const columnType = this.getFilterColumnByName(columnName).type;
        if (['number', 'time'].includes(columnType)) {
          group.addControl(this.controlNamesMap.valueCondition, this.fb.control(null, [Validators.required]));
          group
            .get(this.controlNamesMap.valueCondition)
            .valueChanges.pipe(takeUntil(this.unsubscribe$))
            .subscribe((value) => {
              if (
                [ValueConditionOptionsEnum.EQUALS_NA, ValueConditionOptionsEnum.EQUALS_NOT_EXECUTED].includes(value)
              ) {
                group.get(this.controlNamesMap.value).disable();
              } else {
                group.get(this.controlNamesMap.value).enable();
              }
            });
        }
      });
    return group;
  }

  addFilterToFiltersFormArray(): void {
    this.filtersFormArray.push(this.createFilterGroup());
  }

  removeFilterFromFiltersFormArray(index: number): void {
    this.filtersFormArray.removeAt(index);
  }

  getFilterColumnByName(columnName: string): FilterableColumn {
    if (!columnName) {
      return null;
    }
    return find<FilterableColumn>(this.columns, ['name', columnName]);
  }

  getFilterTypeForColumn(columnName: string): FilterType | null {
    const column = this.getFilterColumnByName(columnName);
    if (!column) {
      return null;
    }
    return column.type;
  }

  isIntColumnType(columnName: string): boolean {
    return this.getFilterColumnByName(columnName).type === 'number';
  }

  getValueOptionsForColumn(columnName: string): FilterableColumnOption[] {
    return get(this.columnOptions, columnName, []);
  }

  getValueConditionOptionsForColumn(columnName: string): ValueConditionOption[] {
    const columnType = this.getFilterColumnByName(columnName).type;
    if (columnType === 'time') {
      return this.valueConditionOptions;
    }
    return filter(
      this.valueConditionOptions,
      (option) => option.value !== ValueConditionOptionsEnum.EQUALS_NOT_EXECUTED
    );
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
