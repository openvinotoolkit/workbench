import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';

import { capitalize } from 'lodash';

import { TargetMachineItem, TargetMachineStatusNames } from '@shared/models/pipelines/target-machines/target-machine';

import { getAvailableDevices } from '../target-list/target-list.component';

enum ColumnNames {
  PROCESSOR_FAMILY = 'processorFamily',
  PROCESSOR_NUMBERS = 'processorNumbers',
  AVAILABLE_DEVICES = 'availableDevices',
  PLATFORM_TAG = 'platformTag',
  CONFIGURATION_DETAILS = 'configurationDetails',
}

@Component({
  selector: 'wb-platform-list',
  templateUrl: './platform-list.component.html',
  styleUrls: ['./platform-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlatformListComponent implements AfterViewInit {
  public ColumnNames = ColumnNames;

  public dataSource = new MatTableDataSource<TargetMachineItem>();

  @Input() set targets(value: TargetMachineItem[]) {
    this.dataSource.data = value || [];
  }

  @Input() selectedTargetId: number = null;

  @Output() targetSelected: EventEmitter<TargetMachineItem> = new EventEmitter<TargetMachineItem>();

  @ViewChild(MatSort) private _sort: MatSort;

  public displayedColumns = [
    ColumnNames.PROCESSOR_FAMILY,
    ColumnNames.PROCESSOR_NUMBERS,
    ColumnNames.AVAILABLE_DEVICES,
    ColumnNames.PLATFORM_TAG,
    ColumnNames.CONFIGURATION_DETAILS,
  ];

  public sortedColumn: Sort = { active: ColumnNames.PROCESSOR_FAMILY, direction: 'desc' };

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

  ngAfterViewInit(): void {
    this.dataSource.sort = this._sort;
    this.dataSource.sortingDataAccessor = this.platformSortingDataAccessor.bind(this);
    this.dataSource.sortData = this.platformSortData.bind(this);
    this._sort.sortChange.emit(this.sortedColumn);
  }

  getProcessorNumberValue(targetMachine: TargetMachineItem): string {
    if (!targetMachine.cpuInfo.processorNumber) {
      return 'N/A';
    }
    return `${capitalize(targetMachine.cpuInfo.platformType)} ${targetMachine.cpuInfo.processorNumber}`;
  }

  getPlatformConfigurationValue({ cpuInfo }: TargetMachineItem): string {
    const { coresNumber, frequency } = cpuInfo;
    const configurationValue = `${coresNumber} cores`;
    if (!frequency) {
      return configurationValue;
    }
    return `${configurationValue} -- ${frequency}`;
  }

  private platformSortData(data: TargetMachineItem[], sort: MatSort): TargetMachineItem[] {
    const { active, direction } = sort;
    if (!active || !direction) {
      return data;
    }
    return data.sort((a, b) => {
      let comparatorResult;
      const valueA = this.dataSource.sortingDataAccessor(a, active).toString();
      const valueB = this.dataSource.sortingDataAccessor(b, active).toString();
      if (active !== ColumnNames.PROCESSOR_FAMILY) {
        comparatorResult = valueA.localeCompare(valueB);
      } else {
        const digitsRegExp = /\d+/g;
        const matchA = valueA.match(digitsRegExp);
        const matchB = valueB.match(digitsRegExp);
        const joinedNumberA = Number(matchA?.join(''));
        const joinedNumberB = Number(matchB?.join(''));
        if (isNaN(joinedNumberA) && isNaN(joinedNumberB)) {
          comparatorResult = valueA.localeCompare(valueB);
        } else if (joinedNumberA > joinedNumberB) {
          comparatorResult = 1;
        } else if (joinedNumberA === joinedNumberB) {
          comparatorResult = 0;
        } else {
          comparatorResult = -1;
        }
      }
      return comparatorResult * (direction === 'asc' ? 1 : -1);
    });
  }

  private platformSortingDataAccessor(data: TargetMachineItem, sortHeaderId: string): string | number {
    if (sortHeaderId === ColumnNames.PROCESSOR_FAMILY) {
      return data.cpuInfo.processorFamily;
    }
    if (sortHeaderId === ColumnNames.PROCESSOR_NUMBERS) {
      return this.getProcessorNumberValue(data);
    }
    if (sortHeaderId === ColumnNames.AVAILABLE_DEVICES) {
      return getAvailableDevices(data);
    }
    if (sortHeaderId === ColumnNames.PLATFORM_TAG) {
      return data.name;
    }
    if (sortHeaderId === ColumnNames.CONFIGURATION_DETAILS) {
      return this.getPlatformConfigurationValue(data);
    }
  }
}
