import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

import { Store } from '@ngrx/store';
import { combineLatest, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { MessagesService } from '@core/services/common/messages.service';

import {
  DatasetStoreActions,
  ModelStoreSelectors,
  ProjectStoreSelectors,
  RootStoreState,
  RouterStoreSelectors,
  TargetMachineSelectors,
} from '@store';
import { ModelItem } from '@store/model-store/model.model';

@Component({
  selector: 'wb-import-calibration-dataset',
  templateUrl: './import-calibration-dataset.component.html',
  styleUrls: ['./import-calibration-dataset.component.scss'],
})
export class ImportCalibrationDatasetComponent implements OnDestroy {
  public importDatasetTip: { tipHeader: string; tipContent: string };
  public selectedModel: ModelItem;
  public projectId: number;
  public accuracyFormState: { optimization: string; loss: string; preset: string } = {
    optimization: '',
    loss: '',
    preset: '',
  };
  private unsubscribe$ = new Subject<void>();

  constructor(
    private messagesService: MessagesService,
    private store$: Store<RootStoreState.State>,
    private router: Router
  ) {
    this.importDatasetTip = {
      tipHeader: 'Import Calibration Dataset Tip:',
      tipContent: this.messagesService.getHint('importDatasetTips', 'importCalibrationDataset'),
    };

    combineLatest([
      this.store$.select(ModelStoreSelectors.getSelectedModelByQueryParam),
      this.store$.select(RouterStoreSelectors.selectQueryProjectId),
      this.store$.select(RouterStoreSelectors.selectOptimizationQueryParam),
      this.store$.select(RouterStoreSelectors.selectLossQueryParam),
      this.store$.select(RouterStoreSelectors.selectPresetQueryParam),
    ])
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(([model, projectId, optimization, loss, preset]) => {
        this.selectedModel = model;
        this.projectId = projectId;
        this.accuracyFormState = { optimization, loss, preset };
      });
  }

  public goToCalibrationOptions(): void {
    this.router.navigate(['projects/edit-calibration', this.projectId], {
      queryParams: this.accuracyFormState,
    });
  }

  public uploadDataset({ uploadingDatasetDTO }): void {
    this.store$.dispatch(DatasetStoreActions.startUploadDataset({ dataset: uploadingDatasetDTO }));
    this.goToCalibrationOptions();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  goToModel(): void {
    this.router.navigate(['models', this.selectedModel.id]);
  }

  goToProject(): void {
    this.router.navigate(['dashboard', this.selectedModel.id, 'projects', this.projectId]);
  }
}
