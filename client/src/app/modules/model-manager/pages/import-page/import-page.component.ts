import { Component, ChangeDetectionStrategy, ViewChild } from '@angular/core';

import { Store } from '@ngrx/store';

import { ModelStoreSelectors, RootStoreState } from '@store';

import { ModelManagerWizardComponent } from '../../components/model-manager-wizard/model-manager-wizard.component';

@Component({
  selector: 'wb-import-page',
  templateUrl: './import-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportPageComponent {
  @ViewChild(ModelManagerWizardComponent) importPage: ModelManagerWizardComponent;

  readonly importingModel$ = this._store$.select(ModelStoreSelectors.selectImportingModel);

  constructor(private _store$: Store<RootStoreState.State>) {}
}
