import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { isEmpty } from 'lodash';

import { MessagesService } from '@core/services/common/messages.service';

import { TF2SavedModel } from '@store/model-store/model.model';

interface FileUploadFieldErrors {
  invalidExtension?: string;
  missingFiles?: string;
  exceedsMaxSize?: string;
}

interface FileWithPathMeta extends File {
  webkitRelativePath: string;
}

@Component({
  selector: 'wb-file-upload-field',
  templateUrl: './file-upload-field.component.html',
  styleUrls: ['./file-upload-field.component.scss'],
})
export class FileUploadFieldComponent implements OnInit {
  @Input()
  public id: string;

  @Input()
  public label: string;

  @Input()
  public uploadingDir = false;

  @Input()
  public multiple = false;

  // Comma-separated string with file extension (e.g. .xml)
  @Input()
  public acceptedFiles = '';

  @Input()
  public optional = false;

  @Input()
  public maxFileSizeMb = null;

  @Input() submitted = false;

  @Input()
  public tooltip;

  @Input()
  testId: string;

  @Input() isRequired = true;

  @Output()
  public fileSelected = new EventEmitter<File | File[] | TF2SavedModel>();

  public selectedFile: File | File[] | TF2SavedModel;

  public errors: FileUploadFieldErrors = {};

  public chooseFiledLabel = 'Select';
  public chooseFolderLabel = 'Select Folder';
  public noFileSelectedLabel = 'No Selected File';
  public optionalLabel = 'optional';
  public requiredFieldMessage = 'This field is required';
  public touched = false;

  constructor(public tooltipService: MessagesService) {}

  ngOnInit() {
    if (!this.id) {
      this.id = 'file-upload-field-id';
    }
  }

  onFileSelected($event: Event) {
    const inputFiles: FileList = ($event.target as HTMLInputElement).files;

    if (!inputFiles.length) {
      return;
    }

    const files: File[] = [];
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < inputFiles.length; i++) {
      files.push(inputFiles[i]);
    }

    if (!files.every((file) => this.isValidFileExtension(file))) {
      this.errors.invalidExtension = 'Invalid file extension';
      return;
    }

    if (this.checkMaxFileSize(files.reduce((acc, file) => acc + file.size, 0))) {
      this.setMaxSizeError();
      return;
    }

    delete this.errors.invalidExtension;

    this.selectedFile = this.multiple ? files : files[0];
    this.fileSelected.emit(this.selectedFile);
  }

  filesPicked(files: FileWithPathMeta[]) {
    const savedModel: TF2SavedModel = {
      name: undefined,
      assets: [],
      variables: [],
      pbModel: undefined,
      size: 0,
    };
    for (const file of files) {
      const path = file.webkitRelativePath.split('/');
      savedModel.size += file.size;
      if (this.checkMaxFileSize(savedModel.size)) {
        this.setMaxSizeError();
        return;
      }
      if (path.includes('assets')) {
        savedModel.assets.push(file);
        continue;
      }
      if (path.includes('variables')) {
        savedModel.variables.push(file);
        continue;
      }

      if (file.name.endsWith('.pb')) {
        savedModel.name = path[0];
        savedModel.pbModel = file;
      }
    }

    if (!savedModel.pbModel || isEmpty(savedModel.variables)) {
      this.errors.missingFiles = 'Uploading folder is missing model files';
      return;
    }
    delete this.errors.missingFiles;
    this.selectedFile = savedModel;
    this.fileSelected.emit(savedModel);
  }

  hasErrors(): boolean {
    return !isEmpty(this.errors);
  }

  get error(): string {
    return this.errors.invalidExtension
      ? this.errors.invalidExtension
      : this.errors.missingFiles
      ? this.errors.missingFiles
      : this.errors.exceedsMaxSize;
  }

  private isValidFileExtension(file: File): boolean {
    if (isEmpty(this.acceptedFiles)) {
      return true;
    }
    const fileExtension = `.${file.name.split('.').pop()}`;
    return this.acceptedFiles.split(',').includes(fileExtension);
  }

  private checkMaxFileSize(size: number): boolean {
    return size > this.maxFileSizeMb * 1000 * 1000;
  }

  private setMaxSizeError() {
    this.errors.exceedsMaxSize = `File exceeds maximum acceptable size: ${this.maxFileSizeMb} Mb`;
  }
}
