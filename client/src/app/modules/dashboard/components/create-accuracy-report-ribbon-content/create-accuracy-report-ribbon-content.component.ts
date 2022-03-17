import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';

import { Store } from '@ngrx/store';

import { MessagesService } from '@core/services/common/messages.service';

import { ModelItem, ModelTaskTypes } from '@store/model-store/model.model';
import { DatasetItem } from '@store/dataset-store/dataset.model';
import { ProjectStatusNames } from '@store/project-store/project.model';
import { AccuracyAnalysisStoreActions, RootStoreState } from '@store';

import { AccuracyReportType } from '@shared/models/accuracy-analysis/accuracy-report';

import { AccuracyReportTypeControlOptions } from '../accuracy-report-type-radio-group/accuracy-report-type-radio-group.component';

@Component({
  selector: 'wb-create-accuracy-report-ribbon-content',
  templateUrl: './create-accuracy-report-ribbon-content.component.html',
  styleUrls: ['./create-accuracy-report-ribbon-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateAccuracyReportRibbonContentComponent extends AccuracyReportTypeControlOptions {
  @Input() projectId: number = null;

  private _model: ModelItem = null;
  @Input() set model(value: ModelItem) {
    this._model = value;
    this.hasAccuracyConfiguration = this._model?.accuracyConfiguration?.taskType !== ModelTaskTypes.GENERIC;
    this._updateOptionsValidity();
  }

  private _dataset: DatasetItem = null;
  @Input() set dataset(value: DatasetItem) {
    this._dataset = value;
    this._updateOptionsValidity();
  }

  private _isInt8Available = false;
  @Input() set isInt8Available(value: boolean) {
    this._isInt8Available = value;
    this._updateOptionsValidity();
  }

  @Input() isTaskRunning = false;

  @Output() createReport = new EventEmitter<void>();

  readonly AccuracyReportType = AccuracyReportType;

  readonly hints = this.messagesService.hintMessages.createAccuracyReportRibbon;
  readonly taskIsRunningMsg = this.messagesService.tooltipMessages.global.taskIsRunning;
  private readonly _dashboardMessages = this.messagesService.tooltipMessages.dashboardPage;

  hasAccuracyConfiguration = false;

  constructor(
    public messagesService: MessagesService,
    private _router: Router,
    private _store$: Store<RootStoreState.State>
  ) {
    super(messagesService);
  }

  private _updateOptionsValidity(): void {
    if (!this._model || !this._dataset) {
      return;
    }

    for (const reportType of this.accuracyReportTypes) {
      this.enableReportType(reportType);
    }

    this.setOptionsValidity(this._model, this._dataset, this.projectId, this._isInt8Available);

    this.selectAvailableReportType();
  }

  createAccuracyReport(): void {
    const reportType: AccuracyReportType = this.accuracyReportTypeControl.value;
    this._store$.dispatch(AccuracyAnalysisStoreActions.createAccuracyReport({ projectId: this.projectId, reportType }));
    this.createReport.emit();
  }

  navigateToAccuracyPage(): void {
    this._router.navigate(['/projects', 'edit-accuracy', 'models', this._model.id, 'projects', this.projectId]);
  }

  get archivedProjectMessage(): string {
    if (Number(this._model?.analysis?.irVersion) <= 10) {
      return this._dashboardMessages.deprecatedIRVersion;
    }
    if (this._isModelArchived || this._isDatasetArchived) {
      return this._dashboardMessages.archivedProject;
    }
    return null;
  }

  get _isModelArchived(): boolean {
    return this._model?.status?.name === ProjectStatusNames.ARCHIVED;
  }

  get _isDatasetArchived(): boolean {
    return this._dataset?.status?.name === ProjectStatusNames.ARCHIVED;
  }

  get isCreateAccuracyReportDisabled(): boolean {
    return (
      this.isTaskRunning ||
      Boolean(this.archivedProjectMessage) ||
      (!this.hasAccuracyConfiguration &&
        this.accuracyReportTypeControl.value !== AccuracyReportType.PARENT_MODEL_PER_TENSOR) ||
      !this.accuracyReportTypeControl.valid
    );
  }

  get areAllReportsDisabled(): boolean {
    return Object.values(this.accuracyReportOptions).every(({ disabled }) => disabled);
  }
}
