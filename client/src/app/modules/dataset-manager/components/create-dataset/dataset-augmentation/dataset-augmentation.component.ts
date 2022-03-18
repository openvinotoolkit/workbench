import { Component, ChangeDetectionStrategy, Output, EventEmitter, Input } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

import { DatasetAugmentationDTO, IImageCorrection } from '@store/dataset-store/dataset.model';

import { FormUtils } from '@shared/utils/form-utils';
import { AdvancedConfigField } from '@shared/components/config-form-field/config-form-field.component';

import { dataAugmentationFormFieldsMap, AugmentationFormFieldNames } from './dataset-augmentation-fields';

@Component({
  selector: 'wb-dataset-augmentation',
  templateUrl: './dataset-augmentation.component.html',
  styleUrls: ['./dataset-augmentation.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetAugmentationComponent {
  @Input() isDevCloud: boolean = null;

  @Output()
  formChangeEvent: EventEmitter<{
    augmentationConfig: DatasetAugmentationDTO;
    augmentationFormValid: boolean;
    additionalImages: number;
  }> = new EventEmitter();

  public datasetAugmentationForm: FormGroup;
  public dataAugmentationFormFields = dataAugmentationFormFieldsMap;
  public selectedPresets: IImageCorrection[] = [];

  constructor(private formBuilder: FormBuilder) {
    const verticalFlipGroup = this.formBuilder.group({});
    const horizontalFlipGroup = this.formBuilder.group({});
    const eraseGroup = this.formBuilder.group({});
    const noiseGroup = this.formBuilder.group({});
    const colorSpaceGroup = this.formBuilder.group({});
    FormUtils.addControlsToForm([this.dataAugmentationFormFields.verticalFlipField], verticalFlipGroup);
    FormUtils.addControlsToForm([this.dataAugmentationFormFields.horizontalFlipField], horizontalFlipGroup);
    FormUtils.addControlsToForm(
      [this.dataAugmentationFormFields.applyEraseField, ...this.dataAugmentationFormFields.eraseFields],
      eraseGroup
    );
    FormUtils.addControlsToForm(
      [this.dataAugmentationFormFields.applyNoiseField, ...this.dataAugmentationFormFields.noiseFields],
      noiseGroup
    );
    FormUtils.addControlsToForm([this.dataAugmentationFormFields.changeColorSpace], colorSpaceGroup);
    this.datasetAugmentationForm = this.formBuilder.group({
      verticalFlip: verticalFlipGroup,
      horizontalFlip: horizontalFlipGroup,
      erase: eraseGroup,
      noise: noiseGroup,
      colorSpace: colorSpaceGroup,
    });

    this.datasetAugmentationForm.valueChanges.subscribe((formState) => {
      const augmentationConfig = {
        ...formState.verticalFlip,
        ...formState.horizontalFlip,
        ...formState.erase,
        ...formState.noise,
        ...formState.colorSpace,
        imageCorrections: this.selectedPresets,
      } as DatasetAugmentationDTO;
      const valid = this.datasetAugmentationForm.valid;
      this.formChangeEvent.emit({
        augmentationConfig,
        augmentationFormValid: valid,
        additionalImages: this.augmentedImagesCount,
      });
    });
  }

  get flipGroup(): FormGroup {
    return this.datasetAugmentationForm.get('flip') as FormGroup;
  }

  get verticalFlipGroup(): FormGroup {
    return this.datasetAugmentationForm.get('verticalFlip') as FormGroup;
  }

  get horizontalFlipGroup(): FormGroup {
    return this.datasetAugmentationForm.get('horizontalFlip') as FormGroup;
  }

  get eraseGroup(): FormGroup {
    return this.datasetAugmentationForm.get('erase') as FormGroup;
  }

  get noiseGroup(): FormGroup {
    return this.datasetAugmentationForm.get('noise') as FormGroup;
  }

  get colorSpaceGroup(): FormGroup {
    return this.datasetAugmentationForm.get('colorSpace') as FormGroup;
  }

  get randomEraseImages(): number {
    return this.eraseGroup.get(AugmentationFormFieldNames.ERASE_IMAGES).value;
  }

  get noiseImages(): number {
    return this.noiseGroup.get(AugmentationFormFieldNames.NOISE_IMAGES).value;
  }

  get verticalFlipApplied(): boolean {
    return this.verticalFlipGroup.get(AugmentationFormFieldNames.VERTICAL_FLIP).value;
  }

  get horizontalFlipApplied(): boolean {
    return this.horizontalFlipGroup.get(AugmentationFormFieldNames.HORIZONTAL_FLIP).value;
  }

  get eraseApplied(): boolean {
    return this.eraseGroup.get(AugmentationFormFieldNames.RANDOM_ERASE).value;
  }

  get noiseApplied(): boolean {
    return this.noiseGroup.get(AugmentationFormFieldNames.NOISE_INJECTION).value;
  }

  get colorSpaceApplied(): boolean {
    return this.colorSpaceGroup.get(AugmentationFormFieldNames.IMAGE_CORRECTIONS).value;
  }

  addPreset({ presets }): void {
    this.selectedPresets = presets;
    this.datasetAugmentationForm.updateValueAndValidity();
  }

  get augmentedImagesCount(): number {
    let additionalImages = 0;
    if (this.noiseApplied) {
      additionalImages += this.noiseImages;
    }
    if (this.eraseApplied) {
      additionalImages += this.randomEraseImages;
    }
    if (this.verticalFlipApplied) {
      additionalImages += 1;
    }
    if (this.horizontalFlipApplied) {
      additionalImages += 1;
    }
    if (this.colorSpaceApplied) {
      additionalImages += this.selectedPresets.length;
    }
    return additionalImages;
  }

  setCheckboxState(checked: boolean, group: FormGroup, field: AdvancedConfigField): void {
    const control = group.get(field.name);

    control.setValue(checked);
  }
}
