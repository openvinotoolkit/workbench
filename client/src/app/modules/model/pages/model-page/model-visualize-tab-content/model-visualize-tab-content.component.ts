import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Store } from '@ngrx/store';

import { Categories, GAActions, GoogleAnalyticsService } from '@core/services/common/google-analytics.service';

import { RootStoreState } from '@store';
import * as ModelsSelector from '@store/model-store/model.selectors';

@Component({
  selector: 'wb-model-visualize-tab-content',
  templateUrl: './model-visualize-tab-content.component.html',
  styleUrls: ['./model-visualize-tab-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelVisualizeTabContentComponent {
  readonly model$ = this._store$.select(ModelsSelector.getSelectedModelByParam);

  constructor(private _store$: Store<RootStoreState.State>, private gAnalyticsService: GoogleAnalyticsService) {
    this.gAnalyticsService.emitEvent(GAActions.EARLY_VISUALIZE, Categories.NETRON);
  }
}
