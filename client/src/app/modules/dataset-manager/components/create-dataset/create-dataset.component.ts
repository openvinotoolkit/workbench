import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

import { isEmpty, max, map, flatten, cloneDeep, isNil } from 'lodash';

import { MessagesService } from '@core/services/common/messages.service';

import { initialAugmentationFormState, IUploadingImage, NADatasetDTO } from '@store/dataset-store/dataset.model';

import { FormUtils } from '@shared/utils/form-utils';

import { datasetUploadFormFields } from '../dataset-upload/dataset-upload.parameters';

interface ImageFile {
  id: number;
  file: File;
}

@Component({
  selector: 'wb-create-dataset',
  templateUrl: './create-dataset.component.html',
  styleUrls: ['./create-dataset.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateDatasetComponent implements OnDestroy {
  @Input() isDevCloud: boolean = null;

  @Input() set defaultImages(value: Blob[]) {
    if (!value) {
      return;
    }
    value.forEach((image: Blob, index) => {
      image['name'] = `${index}.jpg`;
      image['lastModified'] = new Date();
      this._addFile(image as File);
    });
  }

  @Output()
  navigateBack: EventEmitter<void> = new EventEmitter();

  @Output()
  createNADataset: EventEmitter<{ datasetDTO: NADatasetDTO }> = new EventEmitter();

  readonly uploadLimit = 100;
  readonly recommendedSize = 100;
  private readonly _allowedExtensions = ['png', 'jpg', 'jpeg', 'gif', 'bmp'];
  readonly datasetFormControls = cloneDeep(datasetUploadFormFields);
  readonly recommendedSizeMessage = this._messagesService.hintMessages.createDatasetTips.recommendedSize;
  readonly isEmpty = isEmpty;
  readonly isNil = isNil;

  isDatasetImporting = false;

  images: IUploadingImage[] = [];
  private _imageFiles: ImageFile[] = [];

  readonly uploadDatasetForm: FormGroup = this._formBuilder.group({});
  private _augmentationImagesCount = 0;
  private _augmentationConfig = initialAugmentationFormState;
  isAugmentationFormValid = true;

  constructor(private readonly _formBuilder: FormBuilder, private readonly _messagesService: MessagesService) {
    this.datasetFormControls.datasetName.value = 'My Custom Dataset';
    FormUtils.addControlsToForm(Object.values(this.datasetFormControls), this.uploadDatasetForm);
  }

  get imageFileInputAccept(): string {
    return this._allowedExtensions.map((extension) => `.${extension}`).join(',');
  }

  onFileChange(files: File[]): void {
    files.forEach((file) => {
      const fileExtension = file.name.split('.').pop().toLowerCase();
      if (!this._allowedExtensions.includes(fileExtension)) {
        return;
      }
      this._addFile(file);
    });
  }

  fileChanged(event: Event): void {
    this.onFileChange(flatten((event.target as HTMLInputElement).files));
  }

  handleImageRemove({ image }): void {
    URL.revokeObjectURL(image.src);
    const filterPredicate = ({ id }) => id !== image.id;
    this.images = this.images.filter(filterPredicate);
    this._imageFiles = this._imageFiles.filter(filterPredicate);
  }

  importDataset(): void {
    this.isDatasetImporting = true;
    const images = map(this._imageFiles, (el) => el.file);
    const datasetDTO: NADatasetDTO = {
      datasetName: this.uploadDatasetForm.get(this.datasetFormControls.datasetName.name).value,
      images,
      augmentationConfig: this._augmentationConfig,
    };
    this.createNADataset.emit({ datasetDTO });
  }

  get totalImages(): number {
    return this.images.length + this.images.length * this._augmentationImagesCount;
  }

  get infoMessage(): string {
    return this._messagesService.getHint('createDatasetTips', 'createMessage', {
      imagesLength: this.totalImages,
    });
  }

  get warningMessage(): string {
    return this._messagesService.getHint('createDatasetTips', 'createWarningMessage', {
      imagesLength: this.images.length,
      uploadLimit: this.uploadLimit,
      removeImages: this.images.length - this.uploadLimit,
    });
  }

  private _addFile(file: File): void {
    const id = max([...map(this._imageFiles, (image) => image.id), 0]) + 1;
    this._imageFiles.push({ id, file });
    const uploadingImage = {
      id,
      name: file.name,
      src: URL.createObjectURL(file),
    };
    this.images = [...this.images, uploadingImage];
  }

  ngOnDestroy(): void {
    this.images.forEach((image) => URL.revokeObjectURL(image.src));
  }

  setAugmentationConfig({ augmentationConfig, augmentationFormValid, additionalImages }): void {
    this._augmentationConfig = augmentationConfig;
    this._augmentationImagesCount = additionalImages;
    this.isAugmentationFormValid = augmentationFormValid;
  }
}
