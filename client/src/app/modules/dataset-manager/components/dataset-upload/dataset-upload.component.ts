import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

import { cloneDeep, values } from 'lodash';

import { MessagesService } from '@core/services/common/messages.service';

import { DatasetItem, UploadingDatasetDTO } from '@store/dataset-store/dataset.model';
import { ProjectStatusNames } from '@store/project-store/project.model';

import { FormUtils } from '@shared/utils/form-utils';

import { datasetUploadFileField, datasetUploadFormFields } from './dataset-upload.parameters';

@Component({
  selector: 'wb-dataset-upload',
  templateUrl: './dataset-upload.component.html',
  styleUrls: ['./dataset-upload.component.scss'],
})
export class DatasetUploadComponent {
  private _editingDataset: DatasetItem = null;
  @Input() set editingDataset(value: DatasetItem | null) {
    if (!value || value?.status.name === ProjectStatusNames.READY) {
      return;
    }
    this._editingDataset = value;
    this.uploadDatasetForm
      .get(this.datasetFormControls.datasetName.name as string)
      .patchValue(this.editingDataset.name);
  }

  @Input()
  importTip: { tipHeader: string; tipContent: string };

  @Output()
  navigateBack: EventEmitter<void> = new EventEmitter();

  @Output()
  uploadDataset: EventEmitter<{ uploadingDatasetDTO: UploadingDatasetDTO }> = new EventEmitter();

  isUploadingStarted = false;

  public uploadingFile: File;
  public readonly uploadDatasetForm: FormGroup = this._formBuilder.group({});
  public readonly datasetFormControls = cloneDeep(datasetUploadFormFields);
  public readonly datasetUploadFileField = datasetUploadFileField;

  public readonly tooltips = this._messagesService.tooltipMessages.uploadFilePage;
  public readonly hints = this._messagesService.hintMessages.importDatasetTips;
  public readonly feedbackDescription = this._messagesService.hintMessages.feedback.validationDatasetTipFeedback;

  constructor(private readonly _messagesService: MessagesService, private readonly _formBuilder: FormBuilder) {
    FormUtils.addControlsToForm(values(this.datasetFormControls), this.uploadDatasetForm);
  }

  get editingDataset(): DatasetItem {
    return this._editingDataset;
  }

  onFileChange(file: File): void {
    if (!file) {
      return;
    }
    this.uploadingFile = file;
    const fileName = this.uploadingFile.name.split('.')[0];
    this.uploadDatasetForm.get(this.datasetFormControls.datasetName.name as string).patchValue(fileName);
  }

  importFile(): void {
    this.isUploadingStarted = true;
    const uploadingDatasetDTO: UploadingDatasetDTO = {
      datasetName: this.uploadDatasetForm.get(this.datasetFormControls.datasetName.name).value,
      datasetType: this.uploadDatasetForm.get(this.datasetFormControls.datasetType.name).value,
      files: {
        datasetArchive: this.uploadingFile,
      },
    };
    this.uploadDataset.emit({ uploadingDatasetDTO });
  }
}
