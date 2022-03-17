import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Store } from '@ngrx/store';

import { RootStoreState } from '@store';
import * as ModelsSelector from '@store/model-store/model.selectors';
import { ModelDomain } from '@store/model-store/model.model';

@Component({
  selector: 'wb-model-page',
  templateUrl: './model-page.component.html',
  styleUrls: ['./model-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelPageComponent {
  readonly model$ = this._store$.select(ModelsSelector.getSelectedModelByParam);

  readonly ModelDomain = ModelDomain;

  constructor(private _store$: Store<RootStoreState.State>) {}
}
