import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

import { combineLatest, Subject } from 'rxjs';
import { filter, startWith, takeUntil } from 'rxjs/operators';
import { mapValues } from 'lodash';

import { MessagesService } from '@core/services/common/messages.service';

import {
  ModelDomain,
  modelDomainNames,
  modelFrameworkNamesMap,
  ModelFrameworks,
  ModelItem,
  ModelSources,
  TF2SavedModel,
  UploadingModelDTO,
  UploadingTF2SavedModelDTO,
} from '@store/model-store/model.model';
import { ProjectStatus, ProjectStatusNames } from '@store/project-store/project.model';
import { FrameworksAvailabilityStates, IFrameworksAvailability } from '@store/globals-store/globals.state';

import { CustomValidators } from '@shared/components/config-form-field/custom-validators';
import { AdvancedConfigField } from '@shared/components/config-form-field/config-form-field.component';
import { TipMessage } from '@shared/components/tip/tip.component';

import {
  FileField,
  getFileNameWithoutExtension,
  modelFrameworkFileFieldsMap,
  TFInputFileTypes,
  tfModelFileFieldsMap,
  tfModelUtilFieldsMap,
} from './model-import-fields';

export function getUploadModelStage(uploadingModel: ModelItem | Partial<ModelItem>): ProjectStatus {
  if (!uploadingModel || !uploadingModel.stages || !uploadingModel.stages.length) {
    return { progress: 0, name: ProjectStatusNames.QUEUED };
  }
  const [uploadStage] = uploadingModel.stages;
  uploadStage.stage = 'Uploading';
  return uploadStage;
}

enum ImportModelRibbonIds {
  OMZ = 'omz',
  HUGGING_FACE = 'hugging_face',
  ORIGINAL_MODEL = 'original_model',
}

enum TFVersions {
  'TF1' = 1,
  'TF2' = 2,
}

@Component({
  selector: 'wb-model-manager-import',
  templateUrl: './model-manager-import.component.html',
  styleUrls: ['./model-manager-import.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelManagerImportComponent implements OnInit, OnDestroy {
  @Input() uploadingModel: ModelItem;

  @Input() isConnected: boolean;

  @Input() frameworksAvailability: IFrameworksAvailability = null;

  @Output() uploadModel = new EventEmitter<{ model: UploadingModelDTO }>();

  @Output() uploadSavedModel = new EventEmitter<{
    savedModel: UploadingTF2SavedModelDTO;
  }>();

  @Output() cancelEvent: EventEmitter<void> = new EventEmitter();

  @Output() selectModelSource = new EventEmitter<ModelSources>();

  readonly importModelRibbonValues = [
    { id: ImportModelRibbonIds.OMZ, title: 'Open Model Zoo', icon: 'openvino' },
    { id: ImportModelRibbonIds.HUGGING_FACE, title: 'Hugging Face', icon: 'hugging_face' },
    { id: ImportModelRibbonIds.ORIGINAL_MODEL, title: 'Original Model', icon: 'file' },
  ];

  readonly ImportModelRibbonIds = ImportModelRibbonIds;

  selectedImportModelRibbonValue = this.importModelRibbonValues[0].id;

  readonly modelNameField: AdvancedConfigField = {
    type: 'text',
    label: 'Model name',
    name: 'modelName',
    value: '',
    validators: [Validators.required, CustomValidators.nameSafeCharacters],
    tooltip: {
      prefix: 'uploadFilePage',
      value: 'name',
    },
  };

  readonly modelFrameworkField: AdvancedConfigField = {
    type: 'select',
    label: 'Framework',
    name: 'framework',
    value: undefined,
    options: [
      {
        name: modelFrameworkNamesMap[ModelFrameworks.OPENVINO],
        value: ModelFrameworks.OPENVINO,
      },
      {
        name: modelFrameworkNamesMap[ModelFrameworks.CAFFE],
        value: ModelFrameworks.CAFFE,
      },
      {
        name: modelFrameworkNamesMap[ModelFrameworks.MXNET],
        value: ModelFrameworks.MXNET,
      },
      {
        name: modelFrameworkNamesMap[ModelFrameworks.ONNX],
        value: ModelFrameworks.ONNX,
      },
      {
        name: modelFrameworkNamesMap[ModelFrameworks.TF],
        value: ModelFrameworks.TF,
      },
    ],
    validators: [Validators.required],
  };

  readonly modelDomainField: AdvancedConfigField = {
    name: 'domain',
    label: 'Domain',
    type: 'select',
    value: ModelDomain.CV,
    options: [
      { value: ModelDomain.CV, name: modelDomainNames[ModelDomain.CV] },
      { value: ModelDomain.NLP, name: modelDomainNames[ModelDomain.NLP] },
    ],
  };

  readonly modelFrameworkNamesMap = modelFrameworkNamesMap;
  readonly modelDomainNames = modelDomainNames;

  readonly tfModelUtilFieldsMap = tfModelUtilFieldsMap;

  readonly noConnectionMessage = this._messagesService.hintMessages.downloaderTips.cannotConvertModelWithoutConnection;
  readonly importModelHints = this._messagesService.hintMessages.importModel;

  private readonly _modelDomainHints = [this.importModelHints.cvModelsHint, this.importModelHints.nlpModelsHint];
  readonly importTip: TipMessage = {
    header: 'Import Tip',
    content: [...this._modelDomainHints, this.importModelHints.commonImportTips],
  };

  readonly getUploadModelStage = getUploadModelStage;

  // Forms
  uploadModelFormGroup: FormGroup;
  tfModelFormGroup: FormGroup;
  filesFormGroup: FormGroup = this._fb.group({});

  private readonly _unsubscribe$ = new Subject<void>();

  constructor(private readonly _fb: FormBuilder, private readonly _messagesService: MessagesService) {
    const initialModelFramework = this.modelFrameworkField.value;

    this.uploadModelFormGroup = this._fb.group({
      modelName: new FormControl('', this.modelNameField.validators),
      isDynamic: new FormControl(),
      framework: new FormControl(initialModelFramework, this.modelFrameworkField.validators),
      domain: new FormControl(this.modelDomainField.value, this.modelDomainField.validators),
      files: this.filesFormGroup,
    });

    const tfModelFormControlsConfig = mapValues(
      this.tfModelUtilFieldsMap,
      ({ value, validators }) => new FormControl(value, validators)
    );

    this.tfModelFormGroup = this._fb.group(tfModelFormControlsConfig);
  }

  ngOnInit(): void {
    this.selectModelSource.emit(ModelSources.OMZ);
  }

  get modelFrameworkControl(): AbstractControl {
    return this.uploadModelFormGroup.get('framework');
  }

  get tfModelFrozenControl(): AbstractControl {
    return this.tfModelFormGroup.get('isFrozenModel');
  }

  get tfModelVersionControl(): AbstractControl {
    return this.tfModelFormGroup.get('tfVersion');
  }

  get tfKerasModelControl(): AbstractControl {
    return this.tfModelFormGroup.get('isKerasModel');
  }

  get tfInputFilesTypeControl(): AbstractControl {
    return this.tfModelFormGroup.get('inputFilesType');
  }

  get isGettingFrameworksAvailabilityFailed(): boolean {
    return !!this.frameworksAvailability?.error;
  }

  get isSelectedFrameworkConfigured(): boolean {
    if (!this.frameworksAvailability || this.isGettingFrameworksAvailabilityFailed) {
      return false;
    }

    const { data: frameworksAvailability } = this.frameworksAvailability;

    return frameworksAvailability[this.modelFrameworkControl.value] === FrameworksAvailabilityStates.CONFIGURED;
  }

  get frameworkAvailabilityNote(): string {
    return this._messagesService.getHint('frameworksAvailability', 'note', {
      frameworkName: modelFrameworkNamesMap[this.modelFrameworkControl.value],
    });
  }

  isTfModel(): boolean {
    return this.modelFrameworkControl.value === ModelFrameworks.TF;
  }

  isTF1Model(): boolean {
    return this.isTfModel() && this.tfModelVersionControl.value === TFVersions.TF1;
  }

  isTF2Model(): boolean {
    return this.isTfModel() && this.tfModelVersionControl.value === TFVersions.TF2;
  }

  isTfFrozenModel(): boolean {
    return Boolean(this.tfModelFrozenControl.value);
  }

  isKerasModel(): boolean {
    return Boolean(this.tfKerasModelControl.value);
  }

  isTfMetaGraphModel(): boolean {
    return this.tfInputFilesTypeControl.value === TFInputFileTypes.METAGRAPH;
  }

  getModelFrameworkFileFields(): FileField[] {
    const selectedModelFramework = this.modelFrameworkControl.value;
    if (!this.isTfModel() && !this.isTF2Model()) {
      return modelFrameworkFileFieldsMap[selectedModelFramework] || [];
    }
    if (this.isTF2Model() && !this.isKerasModel()) {
      return tfModelFileFieldsMap.tf2FileInputs;
    }
    if (this.isTF2Model() && this.isKerasModel()) {
      return tfModelFileFieldsMap.kerasModel;
    }
    if (this.isTfFrozenModel()) {
      return tfModelFileFieldsMap.frozenFileInputs;
    }
    if (this.tfInputFilesTypeControl.value === TFInputFileTypes.CHECKPOINT) {
      return tfModelFileFieldsMap.checkpointFileInputs;
    }
    if (this.isTfMetaGraphModel()) {
      return tfModelFileFieldsMap.metagraphFileInputs;
    }
    return [];
  }

  getModelNameControl(parentFormGroup: FormGroup): AbstractControl {
    return parentFormGroup.get('modelName');
  }

  handleFileSelected(formGroup: FormGroup, fileType: string, file: File | File[] | TF2SavedModel) {
    formGroup.get([fileType]).setValue(file);
    this.uploadModelFormGroup.updateValueAndValidity();
  }

  handleImportModelRibbonSelection(ribbonValue: ImportModelRibbonIds): void {
    switch (ribbonValue) {
      case ImportModelRibbonIds.ORIGINAL_MODEL:
        this._setFileControlsForImportModel();
        break;
      case ImportModelRibbonIds.OMZ:
        this.selectModelSource.emit(ModelSources.OMZ);
        break;
      case ImportModelRibbonIds.HUGGING_FACE:
        this.selectModelSource.emit(ModelSources.HUGGINGFACE);
        break;
      default:
        break;
    }

    this.selectedImportModelRibbonValue = ribbonValue;
  }

  private _setFileControlsForImportModel(): void {
    combineLatest([
      this.modelFrameworkControl.valueChanges.pipe(startWith(this.modelFrameworkControl.value)),
      this.tfModelVersionControl.valueChanges.pipe(startWith(this.tfModelVersionControl.value)),
      this.tfModelFrozenControl.valueChanges.pipe(startWith(this.tfModelFrozenControl.value)),
      this.tfKerasModelControl.valueChanges.pipe(startWith(this.tfKerasModelControl.value)),
      this.tfInputFilesTypeControl.valueChanges.pipe(startWith(this.tfInputFilesTypeControl.value)),
    ])
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe(([modelFramework]) => {
        this.filesFormGroup = this._fb.group({});
        this.getModelNameControl(this.uploadModelFormGroup).setValue('');
        this.getModelFrameworkFileFields().forEach(({ name }, i) => {
          this.filesFormGroup.addControl(name, new FormControl(null, [Validators.required]));
          // Set model name the same as first uploading file
          if (i === 0) {
            this.filesFormGroup
              .get([name])
              .valueChanges.pipe(
                takeUntil(this._unsubscribe$),
                filter((file) => !!file)
              )
              .subscribe((file) => {
                const nameWithoutExtension = getFileNameWithoutExtension(file.name);
                this.getModelNameControl(this.uploadModelFormGroup).setValue(nameWithoutExtension);
              });
          }
        });
        this.uploadModelFormGroup.controls.files = this.filesFormGroup;
        this.selectModelSource.emit(
          modelFramework === ModelFrameworks.OPENVINO ? ModelSources.IR : ModelSources.ORIGINAL
        );
        this.updateTip();
        this.uploadModelFormGroup.updateValueAndValidity();
      });
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  handleUploadModel() {
    const formValue = this.uploadModelFormGroup.getRawValue();

    if (this.isTF2Model() && !this.isKerasModel()) {
      this.uploadSavedModel.emit({ savedModel: formValue });
      this.uploadModelFormGroup.disable();
      return;
    }
    this.uploadModel.emit({ model: formValue });
    this.uploadModelFormGroup.disable();
  }

  updateTip(): void {
    if (this.isTF1Model()) {
      this.importTip.content = [...this._modelDomainHints, this.importModelHints.tf1ImportTips];
      return;
    }
    if (this.isTF2Model()) {
      this.importTip.content = [...this._modelDomainHints, this.importModelHints.tf2ImportTips];
      return;
    }
    this.importTip.content = [...this._modelDomainHints, this.importModelHints.commonImportTips];
  }

  get areFormsInvalid(): boolean {
    return (
      this.uploadModelFormGroup.invalid ||
      (this.isTfModel() && !this.isTfFrozenModel() && this.tfModelFormGroup.invalid)
    );
  }

  get isImportDisabled(): boolean {
    return (
      this.areFormsInvalid ||
      (this.modelFrameworkControl.value !== ModelFrameworks.OPENVINO && this.isGettingFrameworksAvailabilityFailed) ||
      (!this.isConnected && this.modelFrameworkControl.value && !this.isSelectedFrameworkConfigured)
    );
  }
}
