import { ChangeDetectionStrategy, Component, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

import { Store } from '@ngrx/store';
import { filter, map, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { MessagesService } from '@core/services/common/messages.service';

import { PipelineActions, PipelineSelectors, RootStoreState } from '@store';
import { TargetMachineActions, TargetMachineSelectors } from '@store/target-machine-store';

import { MasterDetailComponent } from '@shared/components/master-detail/master-detail.component';
import {
  TargetMachineItem,
  TargetMachineStatusNames,
  TargetMachineTypes,
} from '@shared/models/pipelines/target-machines/target-machine';
import { RouterUtils } from '@shared/utils/router-utils';

@Component({
  selector: 'wb-target-machines',
  templateUrl: './target-machines.component.html',
  styleUrls: ['./target-machines.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TargetMachinesComponent implements OnDestroy {
  @ViewChild('targetMachinesMasterDetail') machineDetails: MasterDetailComponent;

  targetMachineTypes = TargetMachineTypes;

  public connectionStages$ = this._store$.select(PipelineSelectors.selectConnectionStages);
  public configurationStages$ = this._store$
    .select(PipelineSelectors.selectConfigurationStages)
    .pipe(filter((stages) => !!stages));
  public targetMachines$ = this._store$.select(TargetMachineSelectors.selectAllTargetMachines);
  public localTargetMachine$ = this._store$.select(TargetMachineSelectors.selectLocalTargetMachine);
  public selectedMachine$ = this._store$.select(TargetMachineSelectors.getSelectedTargetMachineByQueryParam);
  public readonly naLabel = 'N/A';

  public getFullTargetMachineName = TargetMachineItem.getFullTargetMachineName;

  readonly tooltips = this._messagesService.tooltipMessages.targetMachinePage;

  public isSelectedMachineConfigured$ = this.selectedMachine$.pipe(
    map((machine) => !!machine && machine.lastConnectionStatus !== TargetMachineStatusNames.NOT_CONFIGURED)
  );

  public isSelectedMachineConfiguring$ = this.selectedMachine$.pipe(
    map(
      (machine) =>
        !!machine &&
        [TargetMachineStatusNames.CONNECTING, TargetMachineStatusNames.CONFIGURING].includes(
          machine.lastConnectionStatus
        )
    )
  );

  public isSelectedMachineConfiguredWithError$ = this.selectedMachine$.pipe(
    map(
      (machine) =>
        !!machine &&
        [TargetMachineStatusNames.CONFIGURATION_FAILURE, TargetMachineStatusNames.CONNECTION_FAILURE].includes(
          machine.lastConnectionStatus
        )
    )
  );

  private _unsubscribe$ = new Subject<void>();

  constructor(
    private _router: Router,
    private _store$: Store<RootStoreState.State>,
    private _messagesService: MessagesService,
    private _location: Location
  ) {
    this._store$.dispatch(TargetMachineActions.loadTargetMachines());

    // Select local target machine if no query parameter set
    this.localTargetMachine$
      .pipe(
        takeUntil(this._unsubscribe$),
        filter((localTargetMachine) => localTargetMachine && !this._router.url.includes('targetId='))
      )
      .subscribe(({ targetId }) => {
        this._router.navigate(['target-machines'], { queryParams: { targetId }, queryParamsHandling: 'merge' });
      });

    this.selectedMachine$
      .pipe(
        takeUntil(this._unsubscribe$),
        filter((targetMachine) => !!targetMachine)
      )
      .subscribe((targetMachine: TargetMachineItem) => {
        this._store$.dispatch(TargetMachineActions.targetMachineSelected({ selectedTarget: targetMachine.targetId }));
        this._store$.dispatch(
          PipelineActions.loadPipelineForTargetMachine({ targetMachineId: targetMachine.targetId })
        );
      });

    RouterUtils.deleteQueryParamsFromUrl(this._location);
  }

  toCreateProject(): void {
    this._router.navigate(['projects/create'], { queryParamsHandling: 'preserve' });
  }

  goToAddMachinePage() {
    this._router.navigate(['target-machines/add'], { queryParamsHandling: 'preserve' });
  }

  handleSelectTargetMachine(targetMachine: TargetMachineItem): void {
    this.updateQueryParams(targetMachine.targetId);
    this._store$.dispatch(TargetMachineActions.targetMachineSelected({ selectedTarget: targetMachine.targetId }));
  }

  handleOpenDetailsForTargetMachine(targetMachine: TargetMachineItem): void {
    this.updateQueryParams(targetMachine.targetId);
    this.machineDetails.detailsSidenav.open();
  }

  removeTarget(targetMachineId: number) {
    this._store$.dispatch(TargetMachineActions.removeTargetMachine({ targetMachineId }));
    this._store$.dispatch(TargetMachineActions.targetMachineSelected({ selectedTarget: null }));
    this._router.navigate([]);
  }

  isLocalTargetMachineSelected(selectedTargetMachine: TargetMachineItem): boolean {
    return selectedTargetMachine && selectedTargetMachine.targetType === TargetMachineTypes.LOCAL;
  }

  updateQueryParams(targetId) {
    this._router.navigate([], { queryParams: { targetId }, queryParamsHandling: 'merge' });
  }

  pingTarget(targetId) {
    this._store$.dispatch(TargetMachineActions.pingTargetMachine({ targetId }));
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }
}
