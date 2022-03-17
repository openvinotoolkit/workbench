import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

import { switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';

import { ModelStoreSelectors, RootStoreState, RouterStoreSelectors } from '@store';
import { ModelItem } from '@store/model-store/model.model';

import { ModelManagerWizardComponent } from '../../components/model-manager-wizard/model-manager-wizard.component';

@Component({
  selector: 'wb-edit-page',
  templateUrl: './edit-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditPageComponent {
  @ViewChild(ModelManagerWizardComponent) importPage: ModelManagerWizardComponent;

  readonly editingModel$: Observable<Partial<ModelItem>> = this._store$
    .select(RouterStoreSelectors.selectParamModelId)
    .pipe(switchMap((routeModelId) => this._store$.select(ModelStoreSelectors.selectModelById, routeModelId)));

  constructor(private _store$: Store<RootStoreState.State>, private _router: Router) {}
}
