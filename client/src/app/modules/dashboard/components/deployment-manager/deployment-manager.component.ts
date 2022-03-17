import { Component, Input, OnDestroy } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';

import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { isEmpty, reduce, remove } from 'lodash';
import { takeUntil } from 'rxjs/operators';

import { MessagesService } from '@core/services/common/messages.service';

import { GlobalsStoreSelectors, ProjectStoreSelectors, RootStoreState } from '@store/index';
import { startDeployment } from '@store/project-store/deployment.actions';
import { DeploymentConfig, ProjectItem, ProjectStatusNames } from '@store/project-store/project.model';
import { PackageSizeInfo } from '@store/globals-store/globals.state';

import { DeviceTargets, DeviceTargetType, OSTypeNames, TargetOSType } from '@shared/models/device';
import { InfoHint } from '@shared/components/info-hint/info-hint.component';

@Component({
  selector: 'wb-deployment-manager',
  templateUrl: './deployment-manager.component.html',
  styleUrls: ['./deployment-manager.component.scss'],
})
export class DeploymentManagerComponent implements OnDestroy {
  private _project: ProjectItem = null;

  @Input() set project(value: ProjectItem) {
    this._project = value;
    this.selectedTargets = [value.deviceType];
    this.calcEstimatedSize();
  }

  @Input()
  disabled = false;

  @Input()
  selectedModelSize: number;

  public deployTip: string = this._messagesService.hintMessages.deploymentTips.deployTip;
  public infoTip: string = this._messagesService.hintMessages.deploymentTips.infoTip;
  public pythonBindingsTooltip: string = this._messagesService.tooltipMessages.deployment.pythonBindings;
  public installScriptsTooltip: string = this._messagesService.tooltipMessages.deployment.installScripts;
  public taskIsRunningMessage: string = this._messagesService.tooltipMessages.global.taskIsRunning;
  public archivedTipMessage = this._messagesService.getHint('common', 'archivedProjectWarning', {
    actionName: 'Pack button',
  });
  public readonly archiveSizeTip = this._messagesService.hintMessages.deploymentTips.archiveSizeTip;

  public deploymentForm: FormGroup;
  public estimatedSize: number;
  public devices: DeviceTargetType[] = [DeviceTargets.CPU, DeviceTargets.GPU, DeviceTargets.MYRIAD, DeviceTargets.HDDL];
  public osTypes: TargetOSType[] = [OSTypeNames.UBUNTU18, OSTypeNames.UBUNTU20];
  public packageSizes: PackageSizeInfo;
  public selectedTargets: DeviceTargetType[];

  public readonly isDeploymentArchivePreparing$ = this._store$.select(
    ProjectStoreSelectors.selectDeploymentArchivePreparing
  );

  public readonly osTypeToNameMap = {
    [OSTypeNames.UBUNTU18]: 'Ubuntu 18.04',
    [OSTypeNames.UBUNTU20]: 'Ubuntu 20.04',
  };

  private _unsubscribe$: Subject<void> = new Subject<void>();

  constructor(
    private _store$: Store<RootStoreState.State>,
    private _messagesService: MessagesService,
    private _formBuilder: FormBuilder
  ) {
    this.deploymentForm = this._formBuilder.group({
      selectedOS: new FormControl(OSTypeNames.UBUNTU18),
      includeModel: new FormControl(false),
      pythonBindings: new FormControl(false),
      installScripts: new FormControl(false),
    });
    this._store$
      .select(GlobalsStoreSelectors.selectPackageSizesInfo)
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe((sizesInfo: PackageSizeInfo) => {
        this.packageSizes = sizesInfo;
        this.calcEstimatedSize();
      });
  }

  get selectedOS(): string {
    return this.deploymentForm.get('selectedOS').value;
  }

  // TODO refactor with observable streams
  public targetChecked(target): void {
    if (!this.selectedTargets.includes(target)) {
      this.selectedTargets.push(target);
      this.calcEstimatedSize();
      return;
    }
    remove(this.selectedTargets, (device) => device === target);
    this.calcEstimatedSize();
  }

  public get isPackagingDisabled(): boolean {
    return !this.selectedOS || isEmpty(this.selectedTargets) || this.disabled || this.isProjectArchived;
  }

  public startPackaging(): void {
    const data = this.deploymentForm.getRawValue();
    const config = {
      projectId: +this._project.id,
      includeModel: data.includeModel,
      pythonBindings: data.pythonBindings,
      installScripts: data.installScripts,
      targetOS: data.selectedOS,
      targets: this.selectedTargets,
    } as DeploymentConfig;
    this._store$.dispatch(startDeployment({ config }));
  }

  public get isProjectArchived(): boolean {
    return this._project && this._project.status.name === ProjectStatusNames.ARCHIVED;
  }

  public calcEstimatedSize(): void {
    if (!this.packageSizes) {
      return;
    }
    const includeModel = this.deploymentForm.get('includeModel').value;
    const pythonBindings = this.deploymentForm.get('pythonBindings').value;
    const installScripts = this.deploymentForm.get('installScripts').value;
    let initialSize = this.packageSizes.IE_COMMON;
    initialSize += includeModel ? this.selectedModelSize : 0;
    initialSize += +pythonBindings * this.packageSizes.PYTHON;
    initialSize += +installScripts * this.packageSizes.INSTALL_SCRIPT;
    this.estimatedSize = reduce(
      this.selectedTargets,
      (acc, target) => {
        return (acc += this.packageSizes.TARGETS[target] + this.packageSizes.DRIVERS[target] * +installScripts);
      },
      initialSize
    );
  }

  public get packagingHint(): InfoHint {
    if (this.disabled && !this.isProjectArchived) {
      return { message: this.taskIsRunningMessage, type: 'warning' };
    }

    return {
      message: this.isProjectArchived ? this.archivedTipMessage : this.infoTip,
      type: 'default',
    };
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }
}
