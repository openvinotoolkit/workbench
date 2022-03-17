import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { Store } from '@ngrx/store';

import { MessagesService } from '@core/services/common/messages.service';

import { DatasetItem } from '@store/dataset-store/dataset.model';
import { DatasetStoreSelectors, RootStoreState } from '@store';

import { CREATE_PROJECT_STAGES } from '../../../../dashboard/constants';

@Component({
  selector: 'wb-select-dataset-stage',
  templateUrl: './select-dataset-stage.component.html',
  styleUrls: ['./select-dataset-stage.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectDatasetStageComponent {
  @Input() selectedDataset: DatasetItem;

  @Input() taskIsRunning = false;

  @Output() selected = new EventEmitter<DatasetItem>();

  @Output() openDatasetUpload = new EventEmitter<void>();

  @Output() openTextDatasetUpload = new EventEmitter<void>();

  public createProjectStages = CREATE_PROJECT_STAGES;

  public readonly datasets$ = this._store$.select(DatasetStoreSelectors.selectAllDatasets);

  public readonly messages = this._messagesService.hintMessages.datasetsTable;

  constructor(private _store$: Store<RootStoreState.State>, private _messagesService: MessagesService) {}
}
