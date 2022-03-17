import { Component, Input, OnDestroy, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidatorFn } from '@angular/forms';

import { Subject } from 'rxjs';
import { each } from 'lodash';
import { Store } from '@ngrx/store';
import { takeUntil } from 'rxjs/operators';

import { MessagesService } from '@core/services/common/messages.service';

import { ExportProjectConfig, OptimizationJobTypes, ProjectItem } from '@store/project-store/project.model';
import { ModelItem, ModelSources, ModelTaskTypes } from '@store/model-store/model.model';
import { DatasetItem } from '@store/dataset-store/dataset.model';
import { ProjectStoreSelectors } from '@store';

import { InfoHint } from '@shared/components/info-hint/info-hint.component';

export interface StartExportProjectEvent {
  projectId: number;
  config: ExportProjectConfig;
}

@Component({
  selector: 'wb-project-export',
  templateUrl: './project-export.component.html',
  styleUrls: ['./project-export.component.scss'],
})
export class ProjectExportComponent implements OnDestroy, OnChanges {
  @Input()
  project: ProjectItem;

  @Input()
  model: ModelItem;

  @Input()
  dataset: DatasetItem;

  @Input()
  disabled = false;

  @Input()
  readOnly = false;

  @Output() startExportProject: EventEmitter<StartExportProjectEvent> = new EventEmitter<StartExportProjectEvent>();

  public exportTip: string = this.messagesService.hintMessages.projectExportTips.exportTip;
  public exportProjectForm: FormGroup;
  public estimatedSize = 0;
  public isExportRunning = false;

  private readonly _isExportRunning = this._store$.select(ProjectStoreSelectors.selectExportRunning);

  public taskIsRunningWarning: InfoHint = {
    message: this.messagesService.tooltipMessages.global.taskIsRunning,
    type: 'warning',
  };

  public accuracyConfigWarning: InfoHint = {
    message: this.messagesService.tooltipMessages.exportProject.accuracyConfig,
    type: 'warning',
  };
  public calibrationConfigWarning: InfoHint = {
    message: this.messagesService.tooltipMessages.exportProject.calibrationConfig,
    type: 'warning',
  };
  public archivedTipMessage = this.messagesService.getHint('common', 'archivedProjectWarning', {
    actionName: 'Export button',
  });

  private unsubscribe$: Subject<void> = new Subject<void>();

  constructor(private _store$: Store, private messagesService: MessagesService, private formBuilder: FormBuilder) {
    this.exportProjectForm = this.formBuilder.group(
      {
        includeModel: new FormControl(false),
        includeDataset: new FormControl(false),
        includeAccuracyConfig: new FormControl(false),
        includeCalibrationConfig: new FormControl(false),
      },
      { validators: this.exportDisabled }
    );
    this._isExportRunning.pipe(takeUntil(this.unsubscribe$)).subscribe((isRunning) => {
      this.isExportRunning = isRunning;
    });
  }

  private exportDisabled: ValidatorFn = (control: AbstractControl) => {
    const { includeModel, includeDataset, includeAccuracyConfig, includeCalibrationConfig } = control.value;

    return (!includeModel && !includeDataset && !includeAccuracyConfig && !includeCalibrationConfig) || this.readOnly
      ? { exportDisabled: true }
      : null;
  };

  ngOnChanges(changes: SimpleChanges): void {
    each(changes, (val, key) => {
      switch (key) {
        case 'project':
          this.exportProjectForm.patchValue({
            includeModel: false,
            includeDataset: false,
            includeAccuracyConfig: false,
            includeCalibrationConfig: false,
          });
          this.estimatedSize = 0;
          return;
        default:
          return;
      }
    });
  }

  public startExport(): void {
    const config = this.exportProjectForm.getRawValue() as ExportProjectConfig;
    const projectId = Number(this.project.id);

    this.isExportRunning = true;
    this.startExportProject.emit({ projectId, config });
  }

  calcPackageSize(assetIncluded: boolean, assetSize: number): void {
    this.estimatedSize += assetIncluded ? assetSize : -assetSize;
  }

  get isExportAccuracyAvailable(): boolean {
    return (
      (this.model?.modelSource === ModelSources.OMZ ||
        this.model?.accuracyConfiguration.taskType !== ModelTaskTypes.GENERIC ||
        this.project?.execInfo.accuracy) &&
      this.project?.isAccuracyAvailable
    );
  }

  get isCalibrationConfigAvailable(): boolean {
    return this.project?.configParameters.optimizationType === OptimizationJobTypes.INT_8;
  }

  public get packagingHint(): InfoHint | null {
    if (this.disabled && !this.readOnly) {
      return { message: this.taskIsRunningWarning.message, type: 'warning' };
    }
    if (this.readOnly) {
      return { message: this.archivedTipMessage, type: 'default' };
    }
    if (this.exportProjectForm.errors?.exportDisabled) {
      return { message: this.messagesService.tooltipMessages.exportProject.selectExportFiles, type: 'default' };
    }

    return null;
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
