import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { filter, map, startWith, switchMap } from 'rxjs/operators';
import { flatten, uniq } from 'lodash';
import { Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';

import { DatasetStoreSelectors, GlobalsStoreSelectors, RootStoreState } from '@store';
import { DatasetItem } from '@store/dataset-store/dataset.model';
import { ModelTaskTypes } from '@store/model-store/model.model';

@Component({
  selector: 'wb-calibration-dataset-section',
  templateUrl: './calibration-dataset-section.component.html',
  styleUrls: ['./calibration-dataset-section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalibrationDatasetSectionComponent implements OnInit {
  @Input() taskType: ModelTaskTypes = null;
  @Input() selectedDatasetId: number = null;
  @Input() projectDatasetId: number = null;
  @Output() importDataset = new EventEmitter<void>();
  @Output() selected = new EventEmitter<DatasetItem>();
  @Output() deleted = new EventEmitter<DatasetItem>();

  private readonly loadingDatasets$ = this.store$.select(DatasetStoreSelectors.selectLoadingDatasets).pipe(
    filter((datasets) => datasets.length > 0),
    map((datasets) => datasets.map(({ id }) => id)),
    startWith([] as number[]),
    switchMap((ids) => this.store$.select(DatasetStoreSelectors.selectDatasetsByIds, ids))
  );

  public datasetsToShow$: Observable<DatasetItem[]> = null;

  public readonly isTaskRunning$ = this.store$.select(GlobalsStoreSelectors.selectTaskIsRunning);

  constructor(private store$: Store<RootStoreState.State>) {}

  ngOnInit() {
    const compatibleDatasets$ = this.store$.select(DatasetStoreSelectors.selectCompatibleDatasets, {
      type: this.taskType,
      persistId: this.projectDatasetId,
    });

    this.datasetsToShow$ = combineLatest([compatibleDatasets$, this.loadingDatasets$]).pipe(map(flatten), map(uniq));
  }
}
