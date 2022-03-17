import { FormControl } from '@angular/forms';
import { Component, ChangeDetectionStrategy, Input, OnInit, OnChanges } from '@angular/core';

import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

export interface ColumnOption {
  value: string;
  name: string;
}

@Component({
  selector: 'wb-multiple-select',
  templateUrl: './multiple-select.component.html',
  styleUrls: ['./multiple-select.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MultipleSelectComponent implements OnInit, OnChanges {
  @Input() control: FormControl;

  @Input() options: ColumnOption[] = [];

  @Input() label: string;

  public searchControl = new FormControl(null);

  public filteredOptions$: Observable<ColumnOption[]>;

  public readonly searchInputPlaceholder = 'Search...';
  public readonly noItemsMatchTitle = 'No items match your search';

  ngOnInit(): void {
    this.filteredOptions$ = this.searchControl.valueChanges.pipe(
      startWith(''),
      map((value) => this.filterSelectedOptions(value))
    );
  }

  ngOnChanges(): void {
    this.searchControl.updateValueAndValidity();
  }

  private filterSelectedOptions(value: string): ColumnOption[] {
    const filterValue = value?.toLowerCase() || '';
    return this.options.filter((option) => option?.value?.toLowerCase().includes(filterValue));
  }
}
