import { Validators } from '@angular/forms';

import { ModelTaskTypes, TaskTypeToNameMap } from '@store/model-store/model.model';

import { AdvancedConfigField } from '@shared/components/config-form-field/config-form-field.component';
import { CustomValidators } from '@shared/components/config-form-field/custom-validators';

import { FileField } from '../../../../model-manager/components/model-manager-import/model-import-fields';

export const textDatasetFormFields: {
  file: FileField;
  name: AdvancedConfigField;
  encoding: AdvancedConfigField;
  separator: AdvancedConfigField;
  header: AdvancedConfigField;
  taskType: AdvancedConfigField;
} = {
  file: {
    name: 'file',
    label: 'Select File',
    maxFileSizeMb: 10000,
    acceptedFiles: '.csv,.tsv,.txt',
    tooltip: {
      prefix: 'uploadTextDatasetPage',
      value: 'textDatasetFile',
    },
  },
  name: {
    type: 'text',
    label: 'Dataset Name',
    name: 'datasetName',
    validators: [Validators.maxLength(30), Validators.required, CustomValidators.nameSafeCharacters],
    value: '',
    tooltip: {
      prefix: 'uploadFilePage',
      value: 'name',
    },
  },
  encoding: {
    type: 'select',
    label: 'File Encoding',
    name: 'encoding',
    value: 'UTF-8',
    // list of encodings synced with python implementations
    options: [
      'UTF-8',
      'IBM866',
      'ISO-8859-2',
      'ISO-8859-3',
      'ISO-8859-4',
      'ISO-8859-5',
      'ISO-8859-6',
      'ISO-8859-7',
      'ISO-8859-8',
      'ISO-8859-10',
      'ISO-8859-13',
      'ISO-8859-14',
      'ISO-8859-15',
      'ISO-8859-16',
      'KOI8-R',
      'KOI8-U',
      'macintosh',
      'windows-1250',
      'windows-1251',
      'windows-1252',
      'windows-1253',
      'windows-1254',
      'windows-1255',
      'windows-1256',
      'windows-1257',
      'windows-1258',
      'GBK',
      'gb18030',
      'Big5',
      'EUC-JP',
      'ISO-2022-JP',
      'Shift_JIS',
      'EUC-KR',
      'UTF-16BE',
      'UTF-16LE',
    ],
    tooltip: {
      prefix: 'uploadTextDatasetPage',
      value: 'encoding',
    },
  },
  separator: {
    type: 'select',
    label: 'Separator',
    name: 'separator',
    value: ',',
    options: [
      { value: ',', name: 'Comma' },
      { value: '\t', name: 'Tab' },
      { value: ':', name: 'Colon' },
      { value: ';', name: 'Semicolon' },
      { value: '|', name: 'Pipe' },
    ],
    tooltip: {
      prefix: 'uploadTextDatasetPage',
      value: 'separator',
    },
  },
  header: {
    type: 'radio',
    label: 'This File Has Header',
    name: 'header',
    value: true,
    options: [
      { name: 'Yes', value: true },
      { name: 'No', value: false },
    ],
    tooltip: {
      prefix: 'uploadTextDatasetPage',
      value: 'header',
    },
  },
  taskType: {
    type: 'select',
    label: 'Task Type',
    name: 'taskType',
    value: ModelTaskTypes.TEXT_CLASSIFICATION,
    options: [
      { value: ModelTaskTypes.TEXT_CLASSIFICATION, name: TaskTypeToNameMap[ModelTaskTypes.TEXT_CLASSIFICATION] },
      { value: ModelTaskTypes.TEXTUAL_ENTAILMENT, name: TaskTypeToNameMap[ModelTaskTypes.TEXTUAL_ENTAILMENT] },
    ],
  },
};
