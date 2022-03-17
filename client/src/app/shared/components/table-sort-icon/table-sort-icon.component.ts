import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { Sort } from '@angular/material/sort';

@Component({
  selector: 'wb-table-sort-icon',
  templateUrl: './table-sort-icon.component.html',
  styleUrls: ['./table-sort-icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableSortIconComponent {
  @Input()
  public sortedColumn: Sort;
  @Input()
  public columnName: string;
}
