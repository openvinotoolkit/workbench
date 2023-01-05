import { Router } from '@angular/router';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Dictionary } from '@ngrx/entity';

import { MessagesService } from '@core/services/common/messages.service';
import { SessionService } from '@core/services/common/session.service';

import { RootStoreState, TargetMachineSelectors } from '@store';
import { ProjectItem, ProjectStatusNames } from '@store/project-store/project.model';
import { InferenceUtils } from '@store/inference-history-store/inference-history.model';

import { DeviceItem, DeviceItemUtils, DeviceTargets, isVPU } from '@shared/models/device';
import { CompoundInferenceConfig } from '@shared/models/compound-inference-config';
import {
  TargetMachineItem,
  TargetMachineStatusNames,
  TargetMachineTypes,
} from '@shared/models/pipelines/target-machines/target-machine';
import { InfoHint } from '@shared/components/info-hint/info-hint.component';

import { AdvancedConfigField } from '@shared/components/config-form-field/config-form-field.component';

export const getStreamField = (label: string, maxValue: number): AdvancedConfigField => ({
  type: 'input',
  label: `${label} (1-${maxValue})`,
  maxNumber: maxValue,
  numberType: 'integer',
  name: 'stream',
  value: 1,
  tooltip: {
    prefix: 'inferenceForm',
    value: 'parallelStreams',
  },
});

export const getBatchField = (): AdvancedConfigField => ({
  type: 'input',
  label: 'Batch size (1-256)',
  maxNumber: 256,
  numberType: 'integer',
  name: 'batch',
  value: 1,
  tooltip: {
    prefix: 'inferenceForm',
    value: 'batch',
  },
});

enum PROFILE_CONFIGURATION_TYPE {
  SINGLE = 'single',
  GROUP = 'group',
}

@Component({
  selector: 'wb-profile-configuration',
  templateUrl: './profile-configuration.component.html',
  styleUrls: ['./profile-configuration.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileConfigurationComponent implements OnInit, OnDestroy {
  private _project: ProjectItem = null;

  @Input() set project(value: ProjectItem) {
    this._project = value;
    this.createForm();
  }

  @Input() disabled = false;

  @Input() disabledMessage: string;

  @Output() infer = new EventEmitter<CompoundInferenceConfig>();

  devicesMap: Dictionary<DeviceItem> = null;

  @Input() target: TargetMachineItem = null;

  PROFILE_CONFIGURATION_TYPE = PROFILE_CONFIGURATION_TYPE;

  inferenceTips = this.messagesService.getHint('inferenceTips', 'inferenceFormTips');
  profileConfigurationForm: UntypedFormGroup = null;
  fieldsMetaData: { stream: AdvancedConfigField; batch: AdvancedConfigField } = null;
  archivedTipMessage = this.messagesService.getHint('common', 'archivedProjectWarning', {
    actionName: 'Action',
  });

  unsubscribe$ = new Subject();

  sessionStartProcessWarningMessage: string = null;

  constructor(
    public messagesService: MessagesService,
    private store$: Store<RootStoreState.State>,
    private router: Router,
    private cdr: ChangeDetectorRef,
    public sessionService: SessionService
  ) {}

  ngOnInit(): void {
    this.store$
      .select(TargetMachineSelectors.selectAllDevicesMap)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((deviceEntities) => {
        this.devicesMap = deviceEntities;
        this.createForm();
        this.cdr.detectChanges();
      });

    this.sessionService.startProcessWarningMessage$.pipe(takeUntil(this.unsubscribe$)).subscribe((message) => {
      this.sessionStartProcessWarningMessage = message;
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  formDefaultsSet(): boolean {
    return !!this._project && !!this.devicesMap && !!this.devicesMap[this._project.deviceId];
  }

  createForm(): void {
    if (!this.formDefaultsSet()) {
      return;
    }
    const minStreams = DeviceItemUtils.getMinStreams(this.devicesMap[this._project.deviceId]);
    const maxStreams = DeviceItemUtils.getMaxStreams(this.devicesMap[this._project.deviceId]);

    this.profileConfigurationForm = new UntypedFormGroup({
      type: new UntypedFormControl(PROFILE_CONFIGURATION_TYPE.SINGLE),
      stream: new UntypedFormControl(minStreams, [Validators.required, Validators.min(1), Validators.max(maxStreams)]),
      batch: new UntypedFormControl(1, [Validators.required, Validators.min(1), Validators.max(256)]),
      inferenceTime: new UntypedFormControl(),
    });

    this.profileConfigurationForm.controls.type.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe((type) => {
      if (type === PROFILE_CONFIGURATION_TYPE.SINGLE) {
        this.profileConfigurationForm.controls.stream.enable();
        this.profileConfigurationForm.controls.batch.enable();
      } else {
        this.profileConfigurationForm.controls.stream.disable();
        this.profileConfigurationForm.controls.batch.disable();
      }
    });

    const shouldUseInfers = isVPU(this._project.deviceName) || this._project.deviceName === DeviceTargets.HDDL;

    this.fieldsMetaData = {
      stream: getStreamField(shouldUseInfers ? 'Parallel infers' : 'Parallel streams', maxStreams),
      batch: getBatchField(),
    };
  }

  submit(): void {
    if (!this.profileConfigurationForm.valid) {
      return;
    }

    const { type } = this.profileConfigurationForm.value;
    if (type === PROFILE_CONFIGURATION_TYPE.SINGLE) {
      this.runInfer();
      return;
    }

    this.router.navigate([
      'dashboard',
      this._project.originalModelId,
      'projects',
      this._project.id,
      'inference',
      'configuration',
    ]);
  }

  runInfer(): void {
    const { modelId, datasetId, deviceId, targetId, deviceName } = this._project;
    const { stream, batch, inferenceTime } = this.profileConfigurationForm.value;
    const inferenceConfig: Partial<CompoundInferenceConfig> = {
      modelId: Number(modelId),
      datasetId: Number(datasetId),
      deviceId,
      inferenceTime,
      deviceName,
      inferences: [{ nireq: stream, batch }],
      targetId,
    };

    this.infer.emit(new CompoundInferenceConfig(inferenceConfig));
  }

  reduceInferenceTime(): void {
    this.profileConfigurationForm.controls.inferenceTime.setValue(InferenceUtils.shortenInferenceTime);
  }

  get inferenceHint(): InfoHint {
    /* Warning hints (higher priority) */
    // Task is running or DevCloud not available
    if (this.disabled && !this.isProjectArchived && this.isTargetConfigured) {
      return { message: this.disabledMessage, type: 'warning' };
    }

    // session termination
    if (this.sessionStartProcessWarningMessage) {
      return { message: this.sessionStartProcessWarningMessage, type: 'warning' };
    }

    /* Information hints (lower priority) */
    // DevCloud different machines disclaimer
    if (this.isDevCloudTarget) {
      return { message: this.messagesService.hintMessages.devCloud.differentMachinesHint, type: 'default' };
    }

    // archived
    if (this.isProjectArchived) {
      return { message: this.archivedTipMessage, type: 'default' };
    }

    // target not configured
    if (!this.isTargetConfigured) {
      return { message: this.messagesService.hintMessages.inferenceTips.NARemoteProfiling, type: 'default' };
    }

    // group inference hint
    if (
      !this.isExecutionDisabled &&
      this.profileConfigurationForm.get('type').value === PROFILE_CONFIGURATION_TYPE.GROUP
    ) {
      return { message: this.messagesService.tooltipMessages.inferenceForm.configureGroupInference, type: 'default' };
    }
  }

  get isProjectArchived(): boolean {
    return this._project.status.name === ProjectStatusNames.ARCHIVED;
  }

  get isTargetConfigured(): boolean {
    return this.target && this.target.lastConnectionStatus !== TargetMachineStatusNames.NOT_CONFIGURED;
  }

  get isDevCloudTarget(): boolean {
    return this.target && this.target.targetType === TargetMachineTypes.DEV_CLOUD;
  }

  get isExecutionDisabled(): boolean {
    return this.isProjectArchived || !this.isTargetConfigured || this.disabled;
  }
}
