import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

import { Store } from '@ngrx/store';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { PipelineActions, PipelineSelectors, RootStoreState } from '@store';
import { TargetMachineActions, TargetMachineSelectors } from '@store/target-machine-store';

import { TargetMachineItem, TargetMachineTypes } from '@shared/models/pipelines/target-machines/target-machine';

@Component({
  selector: 'wb-edit-remote-target',
  templateUrl: './edit-remote-target.component.html',
  styleUrls: ['./edit-remote-target.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditRemoteTargetComponent implements OnDestroy {
  public targetMachine$ = this.store$
    .select(TargetMachineSelectors.getSelectedTargetMachineByParam)
    .pipe(filter((targetMachine: TargetMachineItem) => !!targetMachine));
  public failedPipelineStages$ = this.store$.select(PipelineSelectors.selectConfigurationStages);
  private unsubscribe$ = new Subject<void>();

  constructor(private store$: Store<RootStoreState.State>, private router: Router) {
    this.targetMachine$.pipe(takeUntil(this.unsubscribe$)).subscribe((targetMachine: TargetMachineItem) => {
      if (targetMachine.targetType === TargetMachineTypes.LOCAL) {
        this.navigateToTargetMachinesList();
      }
      this.store$.dispatch(TargetMachineActions.targetMachineSelected({ selectedTarget: targetMachine.targetId }));
      this.store$.dispatch(PipelineActions.loadPipelineForTargetMachine({ targetMachineId: targetMachine.targetId }));
    });
  }

  handleEditTargetMachine(targetMachine: TargetMachineItem) {
    this.store$.dispatch(TargetMachineActions.editTargetMachine({ targetMachine }));
  }

  navigateToTargetMachinesList(): void {
    this.router.navigate(['/target-machines']);
  }

  toCreateProject(): void {
    this.router.navigate(['projects/create']);
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
