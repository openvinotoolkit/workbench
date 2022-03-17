import { Component, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

import { Store } from '@ngrx/store';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { first } from 'rxjs/internal/operators/first';

import { isNil } from 'lodash';

import { MessagesService } from '@core/services/common/messages.service';

import { DatasetStoreActions, DatasetStoreSelectors, GlobalsStoreSelectors, RootStoreState } from '@store';
import { DatasetItem } from '@store/dataset-store/dataset.model';
import { ProjectStatusNames } from '@store/project-store/project.model';

import { RouterUtils } from '@shared/utils/router-utils';

enum DatasetImportTabs {
  CREATE,
  UPLOAD,
}

@Component({
  selector: 'wb-dataset-manager-wizard',
  templateUrl: './dataset-manager-wizard.component.html',
  styleUrls: ['./dataset-manager-wizard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetManagerWizardComponent implements OnDestroy {
  public selectedTabIndex = DatasetImportTabs.CREATE;
  public importDatasetTip: { tipHeader: string; tipContent: string };
  public defaultImages$ = this._store$.select(DatasetStoreSelectors.selectDefaultDatasetImages);
  public isDevCloud$ = this._store$.select(GlobalsStoreSelectors.selectIsDevCloudMode);
  public selectedDataset$ = this._store$.select(DatasetStoreSelectors.getSelectedDatasetByQueryParam);

  public projectStatusNames = ProjectStatusNames;

  public readonly uploadDatasetFailedMessage = this._messagesService.errorMessages.datasetStatus.uploadFailed;

  public tabsLabelsMap = {
    uploadDataset: 'Upload Dataset',
    createDataset: 'Create Dataset',
  };

  private _unsubscribe$: Subject<void> = new Subject<void>();

  constructor(
    private _messagesService: MessagesService,
    private _store$: Store<RootStoreState.State>,
    private _router: Router,
    private _location: Location
  ) {
    this.importDatasetTip = {
      tipHeader: 'Validation Dataset Tip',
      tipContent: this._messagesService.hintMessages.importDatasetTips.importValidationDataset,
    };
    this.selectedDataset$
      .pipe(
        first(),
        filter((dataset: DatasetItem) => !!dataset?.status?.errorMessage)
      )
      .subscribe((dataset: DatasetItem) => {
        this.selectedTabIndex = DatasetImportTabs.UPLOAD;
      });
    this.isDevCloud$
      .pipe(
        takeUntil(this._unsubscribe$),
        filter((isDevCloud) => !isNil(isDevCloud))
      )
      .subscribe((isDevCloud) => {
        this._store$.dispatch(DatasetStoreActions.loadDefaultImages({ isDevCloud }));
      });

    RouterUtils.deleteQueryParamsFromUrl(this._location);
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
    this._store$.dispatch(DatasetStoreActions.cleanDefaultImage());
  }

  toCreateProject(): void {
    this._router.navigate(['projects/create'], { queryParamsHandling: 'preserve' });
  }

  uploadDataset({ uploadingDatasetDTO }): void {
    this._store$.dispatch(DatasetStoreActions.startUploadDataset({ dataset: uploadingDatasetDTO }));
    this.toCreateProject();
  }

  handleNADatasetCreation({ datasetDTO }): void {
    this._store$.dispatch(DatasetStoreActions.createNADataset({ dataset: datasetDTO }));
    this.toCreateProject();
  }
}
