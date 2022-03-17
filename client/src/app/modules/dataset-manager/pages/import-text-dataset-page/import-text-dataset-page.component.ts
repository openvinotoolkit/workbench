import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';

import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';

import { GoogleAnalyticsService } from '@core/services/common/google-analytics.service';

import { DatasetStoreActions, DatasetStoreSelectors, RootStoreState } from '@store';
import { UploadingTextDatasetDTO } from '@store/dataset-store/dataset.model';

@Component({
  selector: 'wb-import-text-dataset-page',
  templateUrl: './import-text-dataset-page.component.html',
  styleUrls: ['./import-text-dataset-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportTextDatasetPageComponent {
  dataset: UploadingTextDatasetDTO = null;

  public uploadErrorMessage$ = this._store$
    .select(DatasetStoreSelectors.getSelectedDatasetByQueryParam)
    .pipe(map((dataset) => dataset?.status?.errorMessage));

  constructor(
    private _router: Router,
    private _store$: Store<RootStoreState.State>,
    private _gaService: GoogleAnalyticsService
  ) {}

  onDatasetChange(dataset: UploadingTextDatasetDTO): void {
    this.dataset = dataset;
  }

  submit(): void {
    this._router.navigate(['projects/create'], { queryParamsHandling: 'preserve' });
    this._store$.dispatch(DatasetStoreActions.startUploadDataset({ dataset: this.dataset }));
    this._gaService.emitUploadTextDataset(this.dataset);
  }
}
