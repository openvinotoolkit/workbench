import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatLegacyTableDataSource as MatTableDataSource } from '@angular/material/legacy-table';
import { Router } from '@angular/router';

import {
  TargetMachineItem,
  TargetMachineStatusNames,
  TargetMachineTypes,
} from '@shared/models/pipelines/target-machines/target-machine';

@Component({
  selector: 'wb-target-machines-table',
  templateUrl: './target-machines-table.component.html',
  styleUrls: ['./target-machines-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TargetMachinesTableComponent {
  @Input() set machines(value: TargetMachineItem[]) {
    this.dataSource.data = value || [];
  }

  @Input() selectedMachineId: number = null;

  @Input() detailsShown = false;

  @Output() selectRow = new EventEmitter<TargetMachineItem>();

  @Output() openDetails = new EventEmitter<TargetMachineItem>();

  @Output() removeTargetEvent = new EventEmitter<number>();

  @Output() pingEvent = new EventEmitter<number>();

  public dataSource = new MatTableDataSource<TargetMachineItem>();
  public displayedColumns = [
    'machineName',
    'details',
    'remoteAddress',
    'user',
    'lastConnected',
    'lastStatus',
    'action',
  ];
  public targetMachineStatusNames = TargetMachineStatusNames;

  constructor(private router: Router) {}

  selectTargetMachine(targetMachine: TargetMachineItem) {
    if (this.selectedMachineId === targetMachine.targetId) {
      return;
    }
    this.selectedMachineId = targetMachine.targetId;
    this.selectRow.emit(targetMachine);
  }

  openTargetMachineDetails(targetMachine: TargetMachineItem) {
    this.selectedMachineId = targetMachine.targetId;
    this.openDetails.emit(targetMachine);
  }

  isLocalTarget({ targetType }: TargetMachineItem): boolean {
    return targetType === TargetMachineTypes.LOCAL;
  }

  isPingAvailable(targetMachine: TargetMachineItem): boolean {
    if (this.isLocalTarget(targetMachine)) {
      return false;
    }
    return [TargetMachineStatusNames.AVAILABLE, TargetMachineStatusNames.CONNECTION_FAILURE].includes(
      targetMachine.lastConnectionStatus
    );
  }

  pingTarget(targetMachine: TargetMachineItem) {
    this.pingEvent.emit(targetMachine.targetId);
  }

  editTarget({ targetId }: TargetMachineItem) {
    this.router.navigate(['target-machines', targetId, 'edit']);
  }

  removeTarget(targetMachine: TargetMachineItem) {
    this.removeTargetEvent.emit(targetMachine.targetId);
  }

  isDeleteTargetActionShown(targetMachine: TargetMachineItem): boolean {
    return (
      !this.isLocalTarget(targetMachine) &&
      ![
        TargetMachineStatusNames.CONFIGURING,
        TargetMachineStatusNames.CONNECTING,
        TargetMachineStatusNames.BUSY,
      ].includes(targetMachine.lastConnectionStatus)
    );
  }

  isEditTargetActionShown({ lastConnectionStatus }: TargetMachineItem): boolean {
    return ![
      TargetMachineStatusNames.CONFIGURING,
      TargetMachineStatusNames.CONNECTING,
      TargetMachineStatusNames.CONFIGURATION_FAILURE,
      TargetMachineStatusNames.BUSY,
    ].includes(lastConnectionStatus);
  }
}
