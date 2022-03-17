import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { Store } from '@ngrx/store';

import { MessagesService } from '@core/services/common/messages.service';

import { ModelItem } from '@store/model-store/model.model';
import { ModelStoreSelectors, RootStoreState } from '@store';

import { CREATE_PROJECT_STAGES } from '../../../../dashboard/constants';

@Component({
  selector: 'wb-select-model-stage',
  templateUrl: './select-model-stage.component.html',
  styleUrls: ['./select-model-stage.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectModelStageComponent {
  @Input() selectedModel: ModelItem;

  @Input() taskIsRunning = false;

  @Input() detailsShown = false;

  @Output() toStage = new EventEmitter<CREATE_PROJECT_STAGES>();

  @Output() selected = new EventEmitter<ModelItem>();

  @Output() selectedDetails = new EventEmitter<ModelItem>();

  @Output() openModelImport = new EventEmitter<void>();

  public createProjectStages = CREATE_PROJECT_STAGES;

  public models$ = this._store$.select(ModelStoreSelectors.selectAllModels);

  public readonly messages = this._messagesService.hintMessages.modelsTable;

  constructor(private _store$: Store<RootStoreState.State>, private _messagesService: MessagesService) {}
}
