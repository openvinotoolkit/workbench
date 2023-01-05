import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnDestroy, Output } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';

import { merge, Subject } from 'rxjs';
import { delay, takeUntil } from 'rxjs/operators';

import { MessagesService } from '@core/services/common/messages.service';

import { ModelTaskTypes } from '@store/model-store/model.model';
import { DatasetTypes, UploadingTextDatasetDTO } from '@store/dataset-store/dataset.model';

import { SelectOption } from '@shared/components/config-form-field/config-form-field.component';
import { FormUtils } from '@shared/utils/form-utils';

import { textDatasetFormFields as formFields } from './text-dataset-form-fields';
import { IClassificationColumns, IEntailmentColumns, ITextDatasetSettings } from '../text-dataset-settings.model';

const loadParser = () => import('../csv-parser/csv-parser');

const TEXT_CLASSIFICATION_COLUMNS: (keyof IClassificationColumns)[] = ['text', 'label'];
const TEXTUAL_ENTAILMENT_COLUMNS: (keyof IEntailmentColumns)[] = ['premise', 'hypothesis', 'label'];

const COLUMNS_TYPE_MAP = {
  [ModelTaskTypes.TEXT_CLASSIFICATION]: TEXT_CLASSIFICATION_COLUMNS,
  [ModelTaskTypes.TEXTUAL_ENTAILMENT]: TEXTUAL_ENTAILMENT_COLUMNS,
};

function buildFormattedDatasetPreview(
  dataset: string[][],
  type: ModelTaskTypes.TEXT_CLASSIFICATION | ModelTaskTypes.TEXTUAL_ENTAILMENT,
  header: boolean,
  settings: ITextDatasetSettings
): IFormattedDataset {
  if (!dataset?.length) {
    return;
  }

  const columns = COLUMNS_TYPE_MAP[type];
  const result: string[][] = [];

  for (const row of dataset.slice(header ? 1 : 0)) {
    const resultRow = [];
    for (const column of columns) {
      const columnId = settings[column];

      resultRow.push(row[columnId]);
    }

    result.push(resultRow);
  }

  return { header: columns, data: result };
}

export interface IFormattedDataset {
  header: string[];
  data: string[][];
}

@Component({
  selector: 'wb-text-dataset-data',
  templateUrl: './text-dataset-data.component.html',
  styleUrls: ['./text-dataset-data.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextDatasetDataComponent implements OnDestroy {
  @Output() datasetChange = new EventEmitter<UploadingTextDatasetDTO>();

  readonly ModelTaskTypes = ModelTaskTypes;

  datasetSlice: string[][] = null;

  formattedDataset: IFormattedDataset = null;

  readonly formFields = formFields;

  readonly form = new UntypedFormGroup({
    [formFields.file.name]: new UntypedFormControl(null, [Validators.required]),
    [formFields.name.name]: new UntypedFormControl(formFields.name.value, formFields.name?.validators),
    [formFields.encoding.name]: new UntypedFormControl(formFields.encoding.value, formFields.encoding?.validators),
    [formFields.separator.name]: new UntypedFormControl(formFields.separator.value, formFields.separator?.validators),
    [formFields.header.name]: new UntypedFormControl(formFields.header.value, formFields.header?.validators),
    [formFields.taskType.name]: new UntypedFormControl(formFields.taskType.value, formFields.taskType?.validators),
    columns: new UntypedFormControl(),
  });

  private readonly _unsubscribe$ = new Subject<void>();

  readonly taskTypeHints = {
    [ModelTaskTypes.TEXT_CLASSIFICATION]: this._messages.hintMessages.textDatasetTaskType.textClassification,
    [ModelTaskTypes.TEXTUAL_ENTAILMENT]: this._messages.hintMessages.textDatasetTaskType.textualEntailment,
  };

  constructor(private _cdr: ChangeDetectorRef, private _messages: MessagesService) {
    merge(
      this.form.controls[formFields.encoding.name].valueChanges,
      this.form.controls[formFields.separator.name].valueChanges
    )
      .pipe(takeUntil(this._unsubscribe$), delay(0))
      .subscribe(() => this.readDatasetFile());

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe$), delay(0)).subscribe(() => {
      this.emitChange();
      this._buildFormattedDataset();
      this._cdr.detectChanges();
    });
  }

  ngOnDestroy() {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  async readDatasetFile(): Promise<void> {
    if (!this.form.value.file) {
      return;
    }

    const { encoding, separator } = this.form.value;
    const parser = await loadParser();
    this.datasetSlice = await parser.parse(this.form.value.file, { encoding, separator, limitLines: 20 });

    this._buildFormattedDataset();

    this._cdr.detectChanges();
  }

  async detectSeparator(): Promise<string> {
    if (!this.form.value.file) {
      return;
    }

    const { encoding } = this.form.value;
    const delimitersToGuess = (this.formFields.separator.options as SelectOption[]).map(
      ({ value }) => value
    ) as string[];
    const parser = await loadParser();
    return await parser.detectSeparator(this.form.value.file, { encoding, delimitersToGuess, limitLines: 20 });
  }

  private _buildFormattedDataset() {
    const { taskType, header, columns } = this.form.value;
    this.formattedDataset = buildFormattedDatasetPreview(this.datasetSlice, taskType, header, columns);
    this._validateSeparator();
  }

  async onFileChange(file: File): Promise<void> {
    if (!file) {
      return;
    }

    this.form.patchValue({
      [formFields.file.name]: file,
      [formFields.name.name]: file.name.split('.')[0],
    });

    const separator = await this.detectSeparator();

    const separatorControl = this.form.get(formFields.separator.name);
    separatorControl.setValue(separator, { emitEvent: false });
    separatorControl.markAsTouched();
    this.form.controls.columns.markAsTouched();

    await this.readDatasetFile();
  }

  private _validateSeparator(): void {
    if (this._isSeparatorValid()) {
      FormUtils.removeErrors(['invalidSeparator'], this.form.controls[formFields.separator.name]);
    } else {
      const message = 'Selected separator cannot evenly split dataset by columns.';
      FormUtils.addErrors({ invalidSeparator: { message } }, this.form.controls[formFields.separator.name]);
    }
  }

  private _isSeparatorValid(): boolean {
    if (!this.datasetSlice) {
      return true;
    }

    return this.datasetSlice.every((row) => row.length === this.datasetSlice[0].length);
  }

  emitChange(): void {
    if (!this.form.valid) {
      return;
    }

    const { file, datasetName, encoding, taskType, separator, header, columns } = this.form.value;

    const dataset: UploadingTextDatasetDTO = {
      datasetName,
      datasetType: DatasetTypes.CSV,
      files: { datasetArchive: file },
      settings: { encoding, taskType, separator, header, columns },
    };
    this.datasetChange.emit(dataset);
  }
}
