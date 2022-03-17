import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Store } from '@ngrx/store';

import { RootStoreState } from '@store';
import * as ModelsSelector from '@store/model-store/model.selectors';

@Component({
  selector: 'wb-model-visualize-output-tab-content',
  templateUrl: './model-visualize-output-tab-content.component.html',
  styleUrls: ['./model-visualize-output-tab-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelVisualizeOutputTabContentComponent {
  readonly model$ = this._store$.select(ModelsSelector.getSelectedModelByParam);

  constructor(private _store$: Store<RootStoreState.State>) {}
}
