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
import { MatLegacyTableDataSource as MatTableDataSource } from '@angular/material/legacy-table';
import { MatSort, Sort } from '@angular/material/sort';

import { Store } from '@ngrx/store';

import { MessagesService } from '@core/services/common/messages.service';
import {
  AnimationService,
  AnimationTargetElement,
  HighlightAnimation,
  tableAnimation,
} from '@core/services/common/animation.service';

import { ModelDomain, ModelItem, TaskTypeToNameMap } from '@store/model-store/model.model';
import { ModelStoreActions, RootStoreState } from '@store';
import { cancelModelUpload, removeModel } from '@store/model-store/model.actions';
import { ProjectStatus, ProjectStatusNames } from '@store/project-store/project.model';

import { deprecatedIrVersionMessageKey } from '@shared/constants';

import { formatSize } from '@shared/pipes/format-number.pipe';

export interface ModelListSelectEvent {
  showDetails: boolean;
  model: ModelItem;
}

@Component({
  selector: 'wb-models-list',
  templateUrl: './models-list.component.html',
  styleUrls: ['./models-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [tableAnimation],
})
export class ModelsListComponent extends HighlightAnimation implements AfterViewInit {
  @Input() set models(value: ModelItem[]) {
    this.dataSource.data = value;
  }

  @Input() selectedModelId: number = null;

  @Input() detailsShown = false;

  @Input() taskIsRunning = false;

  @Output() selected = new EventEmitter<ModelItem>();

  @Output() selectedDetails = new EventEmitter<ModelItem>();

  @ViewChild(MatSort) private _sort: MatSort;

  dataSource: MatTableDataSource<ModelItem> = new MatTableDataSource<ModelItem>([]);

  sortedColumn: Sort = { active: 'date', direction: 'desc' };

  readonly displayedColumns = ['name', 'date', 'usage', 'precisions', 'size', 'status', 'details', 'action'];

  readonly TaskTypeToNameMap = TaskTypeToNameMap;
  readonly projectStatusNames = ProjectStatusNames;
  readonly ModelDomain = ModelDomain;
  readonly formatSize = formatSize;

  private readonly _createProjectTooltips = this._messagesService.tooltipMessages.createProject;
  readonly modelTooltips = this._messagesService.tooltipMessages.model;

  constructor(
    public el: ElementRef,
    public cdr: ChangeDetectorRef,
    public animationService: AnimationService,
    private readonly _store$: Store<RootStoreState.State>,
    private readonly _messagesService: MessagesService
  ) {
    super(el, cdr, animationService, AnimationTargetElement.MODEL_TABLE);
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this._sort;
  }

  isModelAvailable(model: ModelItem): boolean {
    return model?.status?.name === ProjectStatusNames.READY && model?.isConfigured;
  }

  selectRow(model: ModelItem): void {
    if (!this.isModelAvailable(model) || this.selectedModelId === model.id) {
      return;
    }

    this.selectedModelId = model.id;
    this.selected.emit(model);
  }

  selectModelDetails(model: ModelItem): void {
    if (!this.isDetailsAvailable(model)) {
      return;
    }

    if (model.status.name === ProjectStatusNames.READY) {
      this.selected.emit(model);
    }
    this.selectedDetails.emit(model);
  }

  remove({ id }: ModelItem): void {
    if (this.taskIsRunning) {
      return;
    }
    this._store$.dispatch(removeModel({ id }));
    if (this.selectedModelId === id) {
      this.selectedModelId = null;
      this.selected.emit(null);
    }
  }

  cancelModelUpload(element): void {
    this._store$.dispatch(cancelModelUpload({ id: element.id }));
  }

  download({ modelId, name }): void {
    if (this.taskIsRunning) {
      return;
    }
    this._store$.dispatch(
      ModelStoreActions.startModelArchiving({
        modelId,
        isDerivative: false,
        name: `${name}.tar.gz`,
      })
    );
  }

  getReadOnlyTipMessage(model: ModelItem): string {
    return Number(model?.analysis?.irVersion) <= 10
      ? this._createProjectTooltips.deprecatedIRVersion
      : this._createProjectTooltips.archivedModel;
  }

  getErrorMessage({ errorMessage }: ProjectStatus): string {
    return errorMessage === deprecatedIrVersionMessageKey
      ? this._messagesService.errorMessages.modelUpload.deprecatedIRVersionTitle
      : this._messagesService.errorMessages.importModelStatus.defaultErrorMessage;
  }

  isConversionStatusRunning(model: ModelItem): boolean {
    const runningStage = model.stages?.find(({ name }) => name === this.projectStatusNames.RUNNING);

    if (!runningStage && model.status?.name === this.projectStatusNames.RUNNING) {
      return false;
    }

    return model.status?.name !== this.projectStatusNames.READY || !this.isNotConfigured(model);
  }

  isNotConfigured(model: ModelItem): boolean {
    return model.status.name === this.projectStatusNames.READY && !model.isConfigured;
  }

  needToConfigure(model: ModelItem): boolean {
    return (
      (model?.mo?.errorMessage && model.status.name === this.projectStatusNames.ERROR) ||
      !this.isConversionStatusRunning(model) ||
      this.isNotConfigured(model)
    );
  }

  isDetailsAvailable(model: ModelItem): boolean {
    return model.isConfigured && [ProjectStatusNames.READY, ProjectStatusNames.ARCHIVED].includes(model.status.name);
  }

  notReadyModelLabel(model: ModelItem): string {
    return [ProjectStatusNames.READY, ProjectStatusNames.ARCHIVED].includes(model.status.name)
      ? 'Not Configured'
      : 'Not Converted';
  }
}
