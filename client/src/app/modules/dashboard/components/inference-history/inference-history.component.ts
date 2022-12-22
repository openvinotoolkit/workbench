import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { MatLegacyCheckboxChange as MatCheckboxChange } from '@angular/material/legacy-checkbox';
import { MatSort, Sort } from '@angular/material/sort';
import { MatLegacyTableDataSource as MatTableDataSource } from '@angular/material/legacy-table';

import { without } from 'lodash';

import { IInferenceResult } from '@store/inference-history-store/inference-history.model';
import { ProjectStatusNames } from '@store/project-store/project.model';
import { THROUGHPUT_UNIT } from '@store/model-store/model.model';

@Component({
  selector: 'wb-inference-history',
  templateUrl: './inference-history.component.html',
  styleUrls: ['./inference-history.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InferenceHistoryComponent implements AfterViewInit {
  displayedColumns = ['position', 'nireq', 'batch', 'throughput', 'latency', 'status', 'filter'];

  ProjectStatusNames = ProjectStatusNames;

  @Input() set inferenceResults(value: IInferenceResult[]) {
    this.dataSource.data = value;
  }

  @Input() hiddenIds: number[] = [];

  @Input() selectedId: number = null;

  @Input() throughputUnit: THROUGHPUT_UNIT = null;

  @Output() hiddenIdsChange = new EventEmitter<number[]>();

  @Output() selected = new EventEmitter<IInferenceResult>();

  dataSource = new MatTableDataSource<IInferenceResult>();

  public sortedColumn: Sort;

  @ViewChild(MatSort) private _sort: MatSort;

  ngAfterViewInit() {
    this.dataSource.sort = this._sort;
  }

  formatAutoBenchmarkParameter(parameter: number): string {
    if (!parameter) {
      return 'Auto';
    }
    return `${parameter} (Auto)`;
  }

  isDisplayed({ id }: IInferenceResult): boolean {
    return !this.hiddenIds.includes(id);
  }

  isSelected({ id }: IInferenceResult): boolean {
    return id === Number(this.selectedId);
  }

  toggleHidden({ checked }: MatCheckboxChange, { id }: IInferenceResult): void {
    const inferenceItemsIdList = checked ? without(this.hiddenIds, id) : [...this.hiddenIds, id];

    this.hiddenIdsChange.emit(inferenceItemsIdList);
  }

  select(result: IInferenceResult): void {
    if (!result.throughput || this.selectedId === result.id) {
      return;
    }
    if (this.hiddenIds.length && !this.isDisplayed(result)) {
      this.hiddenIdsChange.emit(without(this.hiddenIds, result.id));
    }
    this.selected.emit(result);
  }
}
