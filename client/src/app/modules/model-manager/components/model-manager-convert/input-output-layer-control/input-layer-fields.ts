import { mapValues, isNil } from 'lodash';

import { AdvancedConfigField } from '@shared/components/config-form-field/config-form-field.component';

export enum LayoutTypes {
  NC,
  CN,
  NHWC,
  NCHW,
  CUSTOM,
}

export const LayoutTypeNamesByTypeMap = {
  [LayoutTypes.NC]: 'NC',
  [LayoutTypes.CN]: 'CN',
  [LayoutTypes.NHWC]: 'NHWC',
  [LayoutTypes.NCHW]: 'NCHW',
  [LayoutTypes.CUSTOM]: 'Custom',
};

export interface InputLayerUtilFieldsMapType {
  overrideShape: AdvancedConfigField;
  useFreezePlaceholderWithValue: AdvancedConfigField;
  useMeans: AdvancedConfigField;
  useScales: AdvancedConfigField;
}

const inputLayerUtilFieldsMap: InputLayerUtilFieldsMapType = {
  overrideShape: {
    name: 'overrideShape',
    label: 'Specify Input Shape (Optional)',
    type: 'checkbox',
    value: false,
  },
  useFreezePlaceholderWithValue: {
    name: 'useFreezePlaceholderWithValue',
    label: 'Freeze Placeholder with Value',
    type: 'checkbox',
    value: false,
    tooltip: {
      prefix: 'convertModel',
      value: 'freezePlaceholderWithValue',
    },
  },
  useMeans: {
    name: 'useMeans',
    label: 'Use Means',
    type: 'checkbox',
    value: false,
    tooltip: {
      prefix: 'convertModel',
      value: 'means',
    },
  },
  useScales: {
    name: 'useScales',
    label: 'Use Scales',
    type: 'checkbox',
    value: false,
    tooltip: {
      prefix: 'convertModel',
      value: 'scales',
    },
  },
};

export function getUtilFieldsMap(index?: string | number): InputLayerUtilFieldsMapType {
  if (isNil(index)) {
    return inputLayerUtilFieldsMap;
  }
  return mapValues(inputLayerUtilFieldsMap, (field) => ({ ...field, name: field.name + index }));
}
