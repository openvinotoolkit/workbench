import { Validators } from '@angular/forms';

import { AdvancedConfigField } from '@shared/components/config-form-field/config-form-field.component';
import { CustomValidators } from '@shared/components/config-form-field/custom-validators';
import { TOKENIZER_TYPE_NAME, TokenizerType } from '@shared/models/tokenizer/tokenizer';

import { FileField } from '../../../../model-manager/components/model-manager-import/model-import-fields';

const typeField: AdvancedConfigField = {
  type: 'select',
  label: 'Tokenizer Type',
  name: 'type',
  value: TokenizerType.WORDPIECE,
  options: [
    { value: TokenizerType.WORDPIECE, name: TOKENIZER_TYPE_NAME[TokenizerType.WORDPIECE] },
    { value: TokenizerType.BPE, name: TOKENIZER_TYPE_NAME[TokenizerType.BPE] },
  ],
};

const vocabFileField: FileField = {
  name: 'vocabFile',
  label: 'Vocab File',
  maxFileSizeMb: 10000,
  acceptedFiles: '.txt,.json',
};

const mergesFileField: FileField = {
  name: 'mergesFile',
  label: 'Merges File',
  maxFileSizeMb: 10000,
  acceptedFiles: '.txt,.json',
};

const lowerCaseField: AdvancedConfigField = {
  type: 'radio',
  label: 'Lowercase',
  name: 'lowerCase',
  value: false,
  options: [
    { name: 'Yes', value: true },
    { name: 'No', value: false },
  ],
  tooltip: {
    prefix: 'uploadTokenizerPage',
    value: 'lowerCase',
  },
};

const nameField: AdvancedConfigField = {
  type: 'text',
  label: 'Tokenizer Name',
  name: 'name',
  validators: [Validators.maxLength(30), Validators.required, CustomValidators.nameSafeCharacters],
  value: '',
  tooltip: {
    prefix: 'uploadTokenizerPage',
    value: 'name',
  },
};

export const fields = {
  type: typeField,
  vocabFile: vocabFileField,
  mergesFile: mergesFileField,
  name: nameField,
  lowerCase: lowerCaseField,
};
