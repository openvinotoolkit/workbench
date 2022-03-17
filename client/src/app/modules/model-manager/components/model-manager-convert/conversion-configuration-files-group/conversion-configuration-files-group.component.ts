import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { sortBy } from 'lodash';

import {
  ModelItem,
  TransformationsConfigType,
  TransformationsConfigTypeNamesMap,
} from '@store/model-store/model.model';

import { FormUtils } from '@shared/utils/form-utils';
import { AdvancedConfigField } from '@shared/components/config-form-field/config-form-field.component';
import { FileUploadFieldComponent } from '@shared/components/file-upload-field/file-upload-field.component';

import {
  TransformationsConfigField,
  TransformationsConfigFieldComponent,
} from '../transformations-config-field/transformations-config-field.component';
import { isTfModel, isTFObjectDetectionAPI } from '../model-helpers';
import { HelpChecklistService } from '../help-checklist/help-checklist.service';

export interface FileField {
  name: string;
  label?: string;
  uploadingDir?: boolean;
  acceptedFiles?: string;
  optional?: boolean;
  maxFileSizeMb: number;
  tooltip?: {
    prefix: string;
    value: string;
  };
}

@Component({
  selector: 'wb-conversion-configuration-files-group',
  templateUrl: './conversion-configuration-files-group.component.html',
  styleUrls: ['./conversion-configuration-files-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConversionConfigurationFilesGroupComponent implements OnChanges, OnDestroy {
  @Input()
  model: ModelItem;

  @Input()
  parentGroup: FormGroup;

  @Output()
  usePipelineConfigChecked = new EventEmitter();

  @ViewChild('predefinedTransformationsConfigField')
  public predefinedTransformationsConfigFieldComponent: TransformationsConfigFieldComponent;

  @ViewChild('customTransformationsConfigField')
  public customTransformationsConfigFieldComponent: FileUploadFieldComponent;

  @ViewChild('pipelineConfigFileUploadField')
  public pipelineConfigFileUploadComponent: FileUploadFieldComponent;

  public readonly fields: {
    tfODApiPipelineConfigFile: FileField;
    predefinedConfig: TransformationsConfigField;
    customConfigFile: FileField;
  } = {
    tfODApiPipelineConfigFile: {
      name: 'pipelineConfigFile',
      acceptedFiles: '.config',
      maxFileSizeMb: 5,
    },
    predefinedConfig: {
      name: 'predefinedTransformationsConfig',
      value: null,
      options: [],
      validators: [Validators.required],
    },
    customConfigFile: {
      name: 'customTransformationsConfig',
      acceptedFiles: '.json',
      maxFileSizeMb: 5,
    },
  };
  public readonly utilFields: {
    usePipelineConfig: AdvancedConfigField;
    useTransformationsConfig: AdvancedConfigField;
    transformationsConfigType: AdvancedConfigField;
  } = {
    usePipelineConfig: {
      name: 'usePipelineConfig',
      label: 'Use pipeline config file',
      type: 'checkbox',
      value: false,
      tooltip: {
        prefix: 'convertModel',
        value: 'pipelineConfig',
      },
    },
    useTransformationsConfig: {
      name: 'useTransformationsConfig',
      label: 'Use Model Conversion Configuration File',
      type: 'checkbox',
      value: false,
      tooltip: {
        prefix: 'convertModel',
        value: 'useTransformationsConfig',
      },
    },
    transformationsConfigType: {
      name: 'transformationsConfigType',
      type: 'radio',
      value: TransformationsConfigType.PRECONFIGURED,
      options: [
        {
          name: TransformationsConfigTypeNamesMap[TransformationsConfigType.PRECONFIGURED],
          value: TransformationsConfigType.PRECONFIGURED,
        },
        {
          name: TransformationsConfigTypeNamesMap[TransformationsConfigType.CUSTOM],
          value: TransformationsConfigType.CUSTOM,
        },
      ],
    },
  };

  public readonly group = new FormGroup({});
  public readonly utilGroup = new FormGroup({});

  private _unsubscribe$: Subject<void> = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    public helpChecklistService: HelpChecklistService
  ) {
    this.build();

    this.usePipelineConfigControl.valueChanges.pipe(takeUntil(this._unsubscribe$)).subscribe((isUsed) => {
      if (isUsed) {
        this.group.addControl(this.fields.tfODApiPipelineConfigFile.name, this.fb.control(null, [Validators.required]));
        this.usePipelineConfigChecked.emit();
      } else {
        this.group.removeControl(this.fields.tfODApiPipelineConfigFile.name);
      }
    });

    this.useTransformationsConfigControl.valueChanges.pipe(takeUntil(this._unsubscribe$)).subscribe((isUsed) => {
      if (isUsed) {
        const options = this.model?.mo?.availableTransformationsConfigs || [];

        if (options.length) {
          this.transformationsConfigTypeControl.setValue(TransformationsConfigType.PRECONFIGURED);
          this.transformationsConfigTypeControl.enable();
        } else {
          this.transformationsConfigTypeControl.setValue(TransformationsConfigType.CUSTOM);
          this.transformationsConfigTypeControl.disable();
        }
      } else {
        this.group.removeControl(this.fields.predefinedConfig.name);
        this.group.removeControl(this.fields.customConfigFile.name);
      }
    });

    this.transformationsConfigTypeControl.valueChanges.pipe(takeUntil(this._unsubscribe$)).subscribe((configType) => {
      if (this.useTransformationsConfigControl.value) {
        this.addTransformationsConfigFields(configType);
      }
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    const { model } = changes;

    if (!model?.currentValue) {
      return;
    }

    const configs = this.model?.mo?.availableTransformationsConfigs;

    if (configs) {
      this.fields.predefinedConfig.options = sortBy(configs, 'name');
    }

    if (this.parentGroup) {
      this.parentGroup.addControl('files', this.group);
    }

    this.build();
  }

  build(): void {
    const { usePipelineConfig, useTransformationsConfig, transformationsConfigType } = this.utilFields;
    FormUtils.addControlsToForm(
      [usePipelineConfig, useTransformationsConfig, transformationsConfigType],
      this.utilGroup
    );

    this.populate();
  }

  populate(): void {
    if (!this.model?.mo) {
      return;
    }

    const config = this.model.mo.params || {};

    if (this.isTFObjectDetectionAPI || !this.isModelTypeAnalysisAvailable) {
      // Enable custom TF config and pipeline fields for TF model
      if (this.isModelTypeAnalysisAvailable) {
        this.usePipelineConfigControl.setValue(true);
        this.usePipelineConfigControl.disable();
        this.useTransformationsConfigControl.setValue(true);
        this.useTransformationsConfigControl.disable();
      }
      if (config.isPipelineConfigPersisted) {
        this.usePipelineConfigControl.patchValue(true);

        this.cdr.detectChanges();

        this.pipelineConfigFileUploadComponent.selectedFile = new File([], 'pipeline.config');
        this.pipelineConfigFileControl.clearValidators();
      }
    }

    if (config.predefinedTransformationsConfig || config.customTransformationsConfig) {
      this.useTransformationsConfigControl.setValue(true);
    }

    // Check existing of predefined config control before set value, field may be not ready
    if (config.predefinedTransformationsConfig && this.predefinedConfigControl) {
      this.predefinedConfigControl.setValue(config.predefinedTransformationsConfig);
      this.cdr.detectChanges();
    }

    if (config.predefinedTransformationsConfig) {
      const configs = this.model.mo.availableTransformationsConfigs;
      this.predefinedTransformationsConfigFieldComponent?.setSimilarConfig(
        configs,
        config.predefinedTransformationsConfig
      );
    }

    if (config.customTransformationsConfig) {
      this.transformationsConfigTypeControl.setValue(TransformationsConfigType.CUSTOM);

      this.cdr.detectChanges();

      this.customTransformationsConfigFieldComponent.selectedFile = new File([], 'transformations_config.json');
      this.customConfigControl?.clearValidators();
    }

    this.group.patchValue({
      pipelineConfigFile: config.pipelineConfigFile,
      predefinedTransformationsConfig: config.predefinedTransformationsConfig,
      transformationsConfig: config.customTransformationsConfig,
    });
  }

  get usePipelineConfigControl(): AbstractControl {
    return this.utilGroup.get(this.utilFields.usePipelineConfig.name);
  }

  get useTransformationsConfigControl(): AbstractControl {
    return this.utilGroup.get(this.utilFields.useTransformationsConfig.name);
  }

  get transformationsConfigTypeControl(): AbstractControl {
    return this.utilGroup.get(this.utilFields.transformationsConfigType.name);
  }

  get pipelineConfigFileControl(): AbstractControl {
    return this.group.get(this.fields.tfODApiPipelineConfigFile.name);
  }

  get predefinedConfigControl(): AbstractControl {
    return this.group.get(this.fields.predefinedConfig.name);
  }

  get customConfigControl(): AbstractControl {
    return this.group.get(this.fields.customConfigFile.name);
  }

  async handleSelectPipelineConfigFile(file: File): Promise<void> {
    const fileContent = await FormUtils.getFileTextContentPromise(file);
    this.pipelineConfigFileControl.setValue(fileContent);
    this.cdr.markForCheck();
  }

  async handleSelectTransformationsConfigFile(file: File): Promise<void> {
    const fileContent = await FormUtils.getFileTextContentPromise(file);
    this.customConfigControl.setValue(fileContent);
    this.cdr.markForCheck();
  }

  get isPredefinedConfig(): boolean {
    return (
      this.useTransformationsConfigControl.value &&
      this.transformationsConfigTypeControl.value === TransformationsConfigType.PRECONFIGURED
    );
  }

  get isCustomConfig(): boolean {
    return this.transformationsConfigTypeControl.value === TransformationsConfigType.CUSTOM;
  }

  addTransformationsConfigFields(configType: TransformationsConfigType): void {
    switch (configType) {
      case TransformationsConfigType.PRECONFIGURED:
        this.group.removeControl(this.fields.customConfigFile.name);
        this.group.addControl(
          this.fields.predefinedConfig.name,
          this.fb.control(null, this.fields.predefinedConfig.validators)
        );

        break;
      case TransformationsConfigType.CUSTOM:
        this.group.removeControl(this.fields.predefinedConfig.name);
        this.group.addControl(this.fields.customConfigFile.name, this.fb.control(null, [Validators.required]));

        break;
    }
  }

  get isTfModel(): boolean {
    return isTfModel(this.model);
  }

  get isTFObjectDetectionAPI(): boolean {
    return isTFObjectDetectionAPI(this.model);
  }

  get isModelTypeAnalysisAvailable(): boolean {
    return Boolean(this.model?.mo?.analyzedParams?.model_type);
  }
}
