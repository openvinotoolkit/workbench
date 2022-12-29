import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { MatSort, Sort } from '@angular/material/sort';
import { MatLegacyTableDataSource as MatTableDataSource } from '@angular/material/legacy-table';

import { Store } from '@ngrx/store';
import { isNumber, map } from 'lodash';

import { MessagesService } from '@core/services/common/messages.service';
import {
  AnimationService,
  AnimationTargetElement,
  HighlightAnimation,
  tableAnimation,
} from '@core/services/common/animation.service';

import { DatasetStoreActions, RootStoreState } from '@store';
import { ProjectStatusNames } from '@store/project-store/project.model';
import { DatasetItem, DatasetTypes, DatasetTypeToNameMap } from '@store/dataset-store/dataset.model';
import { TaskTypeToNameMap } from '@store/model-store/model.model';

import { WizardPageQueryParameters } from '../../pages/create-project-page/create-project-page.component';

@Component({
  selector: 'wb-dataset-list',
  templateUrl: './dataset-list.component.html',
  styleUrls: ['./dataset-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [tableAnimation],
})
export class DatasetListComponent extends HighlightAnimation implements AfterViewInit {
  @Input() set datasets(value: DatasetItem[]) {
    this.dataSource.data = value || [];
  }

  @Input() selectedDatasetId: number = null;

  @Input() taskIsRunning = false;

  @Input() undeletableDatasetId: number = null;

  @Input() usage: 'create_project' | 'dashboard' = 'create_project';

  @Output() datasetSelected: EventEmitter<DatasetItem> = new EventEmitter<DatasetItem>();

  @ViewChild(MatSort) private _sort: MatSort;
  @Output() datasetDeleted: EventEmitter<DatasetItem> = new EventEmitter<DatasetItem>();

  public readonly archivedDatasetMsg = this._messagesService.tooltipMessages.createProject.archivedDataset;
  public readonly uploadDatasetFailedMessage = this._messagesService.errorMessages.datasetStatus.uploadFailed;

  public readonly notAvailableLabel = 'N/A';

  public readonly displayedColumns = ['name', 'date', 'type', 'task', 'size', 'status', 'action'];
  public readonly DatasetTypeToNameMap = DatasetTypeToNameMap;
  public readonly DatasetTypes = DatasetTypes;
  public readonly ProjectStatusNames = ProjectStatusNames;
  public readonly dataSource = new MatTableDataSource<DatasetItem>();

  public sortedColumn: Sort = { active: 'date', direction: 'desc' };

  // TODO Remove store from presentational component! Move to parent container instead
  constructor(
    public el: ElementRef,
    public cdr: ChangeDetectorRef,
    public animationService: AnimationService,
    private _store$: Store<RootStoreState.State>,
    private _messagesService: MessagesService
  ) {
    super(el, cdr, animationService, AnimationTargetElement.DATASET_TABLE);
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this._sort;
  }

  isDatasetAvailable(dataset: DatasetItem): boolean {
    return dataset?.status?.name === ProjectStatusNames.READY;
  }

  selectRow(dataset: DatasetItem): void {
    if (!this.isDatasetAvailable(dataset) || this.selectedDatasetId === dataset?.id) {
      return;
    }
    this.selectedDatasetId = dataset.id;
    this.datasetSelected.emit(dataset);
  }

  removeFile(dataset: DatasetItem): void {
    if (this.taskIsRunning) {
      return;
    }
    this._store$.dispatch(DatasetStoreActions.removeDataset({ id: dataset.id }));
    this.datasetDeleted.emit(dataset);
    if (this.selectedDatasetId === dataset.id) {
      this.selectedDatasetId = null;
      this.datasetSelected.emit(null);
    }
  }

  cancelFileUploading({ id }: DatasetItem, event: MouseEvent): void {
    event.stopPropagation();
    this._store$.dispatch(DatasetStoreActions.cancelDatasetUpload({ id }));
  }

  getDatasetQueryParam({ id }: DatasetItem): WizardPageQueryParameters {
    return { datasetId: id };
  }

  getTaskNames(datasetItem: DatasetItem): string {
    if (!datasetItem.tasks?.length) {
      return this.notAvailableLabel;
    }
    return map(datasetItem.tasks, (task) => TaskTypeToNameMap[task]).join(', ');
  }

  getSize(dataset: DatasetItem): string {
    if (!isNumber(dataset.numberOfImages) || dataset.status.name !== ProjectStatusNames.READY) {
      return this.notAvailableLabel;
    }

    const unit = dataset.type === DatasetTypes.CSV ? 'samples' : 'images';
    return `${dataset.numberOfImages} ${unit}`;
  }
}
