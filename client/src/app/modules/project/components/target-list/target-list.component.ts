import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatLegacyTableDataSource as MatTableDataSource } from '@angular/material/legacy-table';

import { map } from 'lodash';

import { TargetMachineItem, TargetMachineStatusNames } from '@shared/models/pipelines/target-machines/target-machine';

export function getAvailableDevices(targetMachine: TargetMachineItem): string {
  const devices: string[] = map(targetMachine.devices, 'deviceName') || [];
  return devices.join(', ');
}

@Component({
  selector: 'wb-target-list',
  templateUrl: './target-list.component.html',
  styleUrls: ['./target-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TargetListComponent {
  @Input() set targets(value: TargetMachineItem[]) {
    this.dataSource.data = value || [];
  }

  @Input() isDevCloudMode = false;

  @Input() selectedTargetId: number = null;

  @Output() targetSelected: EventEmitter<TargetMachineItem> = new EventEmitter<TargetMachineItem>();

  @Output() toTargetMachine: EventEmitter<number> = new EventEmitter<number>();

  public dataSource = new MatTableDataSource<TargetMachineItem>();

  get displayedColumns(): string[] {
    const columnNames = ['targetName', 'availableDevices', 'status'];
    if (!this.isDevCloudMode) {
      columnNames.push('actions');
    }
    return columnNames;
  }

  getAvailableDevices = getAvailableDevices;

  selectRow(target: TargetMachineItem): void {
    if (
      this.selectedTargetId === target.targetId ||
      target.lastConnectionStatus !== TargetMachineStatusNames.AVAILABLE
    ) {
      return;
    }
    this.selectedTargetId = target.targetId;
    this.targetSelected.emit(target);
  }
}
