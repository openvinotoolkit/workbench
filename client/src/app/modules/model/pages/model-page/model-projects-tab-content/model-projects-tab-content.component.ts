import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Store } from '@ngrx/store';

import { RootStoreState } from '@store';
import * as ModelsSelector from '@store/model-store/model.selectors';

@Component({
  selector: 'wb-model-projects-tab-content',
  templateUrl: './model-projects-tab-content.component.html',
  styleUrls: ['./model-projects-tab-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelProjectsTabContentComponent {
  readonly model$ = this._store$.select(ModelsSelector.getSelectedModelByParam);

  constructor(private _store$: Store<RootStoreState.State>) {}
}
