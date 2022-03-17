import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

import { Store } from '@ngrx/store';

import { RootStoreState } from '@store';
import * as TargetMachineActions from '@store/target-machine-store/target-machine.actions';

import { TargetMachineItem } from '@shared/models/pipelines/target-machines/target-machine';
import { RouterUtils } from '@shared/utils/router-utils';

@Component({
  selector: 'wb-add-remote-target',
  templateUrl: './add-remote-target.component.html',
  styleUrls: ['./add-remote-target.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddRemoteTargetComponent {
  constructor(private _store$: Store<RootStoreState.State>, private _router: Router, private _location: Location) {
    RouterUtils.deleteQueryParamsFromUrl(this._location);
  }

  handleMachineAdd(targetMachine: TargetMachineItem) {
    this._store$.dispatch(TargetMachineActions.addTargetMachine({ targetMachine }));
  }

  handleCancel() {
    this._router.navigate(['/target-machines'], { queryParamsHandling: 'preserve' });
  }

  toCreateProject(): void {
    this._router.navigate(['projects/create'], { queryParamsHandling: 'preserve' });
  }
}
