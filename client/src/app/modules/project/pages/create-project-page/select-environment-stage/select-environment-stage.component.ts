import { Component, OnInit, ChangeDetectionStrategy, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

import { filter, first, skipWhile, switchMap, take, takeUntil, takeWhile, withLatestFrom } from 'rxjs/operators';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Store } from '@ngrx/store';
import { find, isEmpty, sortBy } from 'lodash';
import { Dictionary } from '@ngrx/entity';

import { MessagesService } from '@core/services/common/messages.service';
import { GoogleAnalyticsService } from '@core/services/common/google-analytics.service';
import { SessionService } from '@core/services/common/session.service';

import { ModelItem, ModelPrecisionEnum, ModelPrecisionType } from '@store/model-store/model.model';
import { DatasetItem } from '@store/dataset-store/dataset.model';
import { GlobalsStoreSelectors, RootStoreState, TargetMachineSelectors } from '@store';

import {
  CpuPlatformType,
  CpuPlatformTypeNamesMap,
  TargetMachineItem,
  TargetMachineTypes,
} from '@shared/models/pipelines/target-machines/target-machine';
import { DeviceItem, DeviceTargets } from '@shared/models/device';

import { CREATE_PROJECT_STAGES } from '../../../../dashboard/constants';

export enum ENVIRONMENT_RIBBON_IDS {
  TARGET = 'target',
  PLATFORM = 'platform',
}

@Component({
  selector: 'wb-select-environment-stage',
  templateUrl: './select-environment-stage.component.html',
  styleUrls: ['./select-environment-stage.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectEnvironmentStageComponent implements OnInit, OnDestroy {
  @Input() selectedModel: ModelItem;

  @Input() selectedDataset: DatasetItem;

  @Output() toStage = new EventEmitter<CREATE_PROJECT_STAGES>();

  @Output() setSelectedTargetDevice = new EventEmitter<DeviceItem>();

  @Output() setTargetMachine = new EventEmitter<TargetMachineItem>();

  @Output() setDefaultTargetMachine = new EventEmitter<TargetMachineItem>();

  @Output() setIsSupportedPrecision = new EventEmitter<boolean>();

  @Output() setUnsupportedPrecisions = new EventEmitter<ModelPrecisionType[]>();

  public createProjectStages = CREATE_PROJECT_STAGES;
  public readonly environmentTypes = ENVIRONMENT_RIBBON_IDS;
  public readonly environmentRibbonValues = [
    { id: ENVIRONMENT_RIBBON_IDS.TARGET, title: 'Target' },
    { id: ENVIRONMENT_RIBBON_IDS.PLATFORM, title: 'Platform' },
  ];
  public readonly cpuPlatformTypeNamesMap = CpuPlatformTypeNamesMap;
  public defaultTargetMachine: TargetMachineItem;
  private availableOptimizations: Dictionary<string[]>;
  public selectedTargetDevice: DeviceItem;

  public readonly devCloudMessages = this.messagesService.hintMessages.devCloud;

  public isTargetBasedView$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
  public selectedBasePlatform$: BehaviorSubject<CpuPlatformType> = new BehaviorSubject<CpuPlatformType>(null);
  public selectedTargetMachine$: BehaviorSubject<TargetMachineItem> = new BehaviorSubject<TargetMachineItem>(null);

  // Store selectors
  public isDevCloudMode$ = this.store$.select(GlobalsStoreSelectors.selectIsDevCloudMode);
  public isDevCloudNotAvailable$ = this.store$.select(GlobalsStoreSelectors.selectIsDevCloudNotAvailable);

  public targets$ = this.isTargetBasedView$.pipe(
    switchMap((isTargetBasedView) => {
      if (isTargetBasedView) {
        return this.store$.select(TargetMachineSelectors.selectAllTargetMachines);
      }
      return this.selectedBasePlatform$.pipe(
        switchMap((selectedBasePlatform) =>
          this.store$.select(TargetMachineSelectors.selectTargetMachinesForPlatform, selectedBasePlatform)
        )
      );
    })
  );
  public availablePlatforms$: Observable<CpuPlatformType[]> = this.store$.select(
    TargetMachineSelectors.selectAvailablePlatforms
  );
  public activeDevicesForSelectedTarget$ = this.selectedTargetMachine$.pipe(
    filter((targetMachine) => !!targetMachine),
    switchMap(({ targetId }: TargetMachineItem) =>
      this.store$.select(TargetMachineSelectors.selectActiveDevicesForTarget, targetId)
    )
  );
  public availableOptimizationsForSelectedTarget$ = this.selectedTargetMachine$.pipe(
    filter((targetMachine) => !!targetMachine),
    switchMap(({ targetId }: TargetMachineItem) =>
      this.store$.select(TargetMachineSelectors.selectAvailableOptimizationsForTarget, targetId)
    )
  );

  private _unsubscribe$: Subject<void> = new Subject<void>();

  private static findMachineWithBestConfiguration(targetMachines: TargetMachineItem[]): TargetMachineItem {
    if (isEmpty(targetMachines)) {
      return;
    }
    const sortedTargetMachines = sortBy(targetMachines, ['cpuInfo.processorNumber']);
    return sortedTargetMachines[sortedTargetMachines.length - 1];
  }

  constructor(
    private store$: Store<RootStoreState.State>,
    private router: Router,
    public messagesService: MessagesService,

    private gAnalyticsService: GoogleAnalyticsService,
    public sessionService: SessionService
  ) {}

  ngOnInit(): void {
    // Set default selected base platform
    this.availablePlatforms$
      .pipe(
        takeUntil(this._unsubscribe$),
        filter((availablePlatforms) => !!(availablePlatforms && availablePlatforms.length)),
        first()
      )
      .subscribe((availablePlatforms) => {
        const defaultSelectedBasePlatform =
          availablePlatforms.length > 1 && availablePlatforms.includes(CpuPlatformType.CORE)
            ? CpuPlatformType.CORE
            : availablePlatforms[0];
        this.selectedBasePlatform$.next(defaultSelectedBasePlatform);
      });

    // Automatically select default target machine on page init
    this.targets$
      .pipe(
        takeUntil(this._unsubscribe$),
        takeWhile(() => !this.selectedTargetMachine$.getValue()),
        filter((targetMachines) => !!targetMachines),
        withLatestFrom(this.isDevCloudMode$, this.isDevCloudNotAvailable$)
      )
      .subscribe(([targetMachines, isDevCloudMode, isDevCloudNotAvailable]) => {
        const machine = this.getDefaultTargetMachine(isDevCloudMode, isDevCloudNotAvailable, targetMachines);

        this.defaultTargetMachine = machine;
        this.setDefaultTargetMachine.emit(machine);
        this.selectedTargetMachine$.next(machine);
      });

    // Automatically select CPU device after selection of target machine
    this.activeDevicesForSelectedTarget$.pipe(takeUntil(this._unsubscribe$)).subscribe((activeDevices) => {
      const cpuDevice = activeDevices.find(({ type }) => type === DeviceTargets.CPU);
      this.setDevice(cpuDevice);
    });

    // Automatically select target after selection of base platform
    this.selectedBasePlatform$
      .pipe(
        takeUntil(this._unsubscribe$),
        skipWhile(() => !this.selectedTargetMachine$.getValue()),
        switchMap(() => this.targets$.pipe(take(1)))
      )
      .subscribe(([firstTarget]) => {
        this.selectedTargetMachine$.next(firstTarget);
      });

    // DevCloud
    this.isDevCloudMode$.pipe(takeUntil(this._unsubscribe$)).subscribe((isDevCloudMode) => {
      this.isTargetBasedView$.next(!isDevCloudMode);
    });

    this.selectedTargetMachine$
      .pipe(
        takeUntil(this._unsubscribe$),
        filter((targetMachine) => !!targetMachine)
      )
      .subscribe((target: TargetMachineItem) => {
        this.updateTargetMachineValue(target);
      });

    // Update available optimizations
    this.availableOptimizationsForSelectedTarget$
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe((availableOptimizations) => {
        this.availableOptimizations = availableOptimizations;
        this.checkSupportedPrecision(this.selectedTargetDevice);
      });

    this.store$
      .select(TargetMachineSelectors.selectDeviceByQueryParams)
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe((device: DeviceItem) => {
        this.setDevice(device);
      });

    // Set target machine and device after return from inner pages
    this.store$
      .select(TargetMachineSelectors.getSelectedTargetMachineByQueryParam)
      .pipe(
        takeUntil(this._unsubscribe$),
        filter((targetMachine) => !!targetMachine)
      )
      .subscribe((targetMachine: TargetMachineItem) => {
        this.selectedTargetMachine$.next(targetMachine);
        this.updateTargetMachineValue(targetMachine);
      });
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  openAddTargetMachine(): void {
    const queryParams = {
      modelId: this.selectedModel?.id,
      targetId: this.selectedTargetMachine$.getValue()?.targetId,
      datasetId: this.selectedDataset?.id,
      stage: CREATE_PROJECT_STAGES.ENVIRONMENT,
    };

    this.router.navigate(['target-machines', 'add'], { queryParams });
  }

  toTargetMachine(targetId: number): void {
    const queryParams = {
      targetId,
      modelId: this.selectedModel?.id || null,
      datasetId: this.selectedDataset?.id || null,
      stage: CREATE_PROJECT_STAGES.ENVIRONMENT,
    };

    this.router.navigate(['target-machines'], { queryParams });
  }

  getDefaultTargetMachine(isDevCloudMode, isDevCloudNotAvailable, targetMachines): TargetMachineItem {
    if (isDevCloudMode) {
      if (isDevCloudNotAvailable) {
        return null;
      }

      const defaultTargetMachine = SelectEnvironmentStageComponent.findMachineWithBestConfiguration(targetMachines);
      return defaultTargetMachine || null;
    }

    const localTargetMachine = find(targetMachines, ({ targetType }) => targetType === TargetMachineTypes.LOCAL);
    return localTargetMachine || null;
  }

  isDeviceDisabled(device: DeviceItem): boolean {
    if (!this.selectedModel) {
      return true;
    }

    if (!this.selectedModel.bodyPrecisions) {
      return false;
    }

    if (this.selectedModel.bodyPrecisions.includes(ModelPrecisionEnum.MIXED)) {
      return false;
    }

    return !this.selectedModel.bodyPrecisions.every((precision: string) => {
      return device.optimizationCapabilities.includes(precision);
    });
  }

  setDevice(device: DeviceItem): void {
    this.selectedTargetDevice = device;
    this.setSelectedTargetDevice.emit(device);
    this.checkSupportedPrecision(device);
  }

  updateTargetMachineValue(target: TargetMachineItem): void {
    this.setTargetMachine.emit(target);
    this.gAnalyticsService.emitAvailableDevicesEvent(target.devices);
  }

  checkSupportedPrecision(newTarget: DeviceItem): void {
    if (!this.selectedModel || !newTarget || !this.availableOptimizations) {
      this.setIsSupportedPrecision.emit(false);
      return;
    }

    // In case if analyzing stage failed, profiling is still available
    if (!this.selectedModel.bodyPrecisions) {
      this.setIsSupportedPrecision.emit(true);
      return;
    }

    if (this.selectedModel.bodyPrecisions.includes(ModelPrecisionEnum.MIXED)) {
      this.setIsSupportedPrecision.emit(true);
      return;
    }

    if (!this.availableOptimizations[newTarget.id]) {
      return;
    }

    const unsupportedPrecisions = this.selectedModel.bodyPrecisions.filter((precision: string) => {
      return !this.availableOptimizations[newTarget.id].includes(precision);
    });

    this.setIsSupportedPrecision.emit(!unsupportedPrecisions.length);
    this.setUnsupportedPrecisions.emit(unsupportedPrecisions);
  }

  setTargetAsDefault(): void {
    this.selectedTargetMachine$.next(this.defaultTargetMachine);
  }
}
