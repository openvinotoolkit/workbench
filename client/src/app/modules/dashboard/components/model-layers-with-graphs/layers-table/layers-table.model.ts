import { MatTableDataSource } from '@angular/material/table';

import { Dictionary } from '@ngrx/entity';

import { ModelPrecisionEnum } from '@store/model-store/model.model';

export type ParameterValueType = string | number | number[] | string[];

export interface OriginalIRLayerItem {
  layerName: string;
  layerType: string;
  spatialParams: Dictionary<ParameterValueType>;
  specificParams: Dictionary<ParameterValueType>;
  positionalData: Dictionary<ParameterValueType>;
  blobData?: Dictionary<ParameterValueType>;
}

export interface NetworkLayerDetails {
  executionParams: Dictionary<ParameterValueType>;
  positionalData: Dictionary<ParameterValueType>;
  fusedLayers: OriginalIRLayerItem[];
  splitExecutedLayers: string[];
}

export interface ExecutedLayerItem {
  layerName: string;
  layerNameB?: string;
  layerType: string;
  execTime: (number | string)[] | null;
  delta?: number; // For comparison mode
  ratio?: number; // For comparison mode
  outputPrecisions: string[];
  runtimePrecision: ModelPrecisionEnum;
  runtimePrecisionB?: ModelPrecisionEnum; // For comparison mode
  details: NetworkLayerDetails[];
}

export enum ColumnNames {
  LAYER_NAME = 'layerName',
  LAYER_TYPE = 'layerType',
  EXEC_ORDER = 'execOrder',
  LAYER = 'layer',
  EXEC_TIME = 'execTime',
  PRECISION = 'runtimePrecision',
  LAYER_INFORMATION = 'layerInformation',
  EXEC_TIME_B = 'execTimeB',
  PRECISION_B = 'runtimePrecisionB',
  DELTA = 'delta',
  RATIO = 'ratio',
  CONFIGURATION_A = 'configurationA',
  CONFIGURATION_B = 'configurationB',
}

export enum ColumnLabels {
  LAYER_NAME = 'Layer Name',
  LAYER_TYPE = 'Layer Type',
  EXEC_ORDER = 'Execution Order',
  LAYER = 'Layer',
  EXEC_TIME = 'Execution Time',
  PRECISION = 'Runtime Precision',
  LAYER_INFORMATION = 'Layer Information',
  EXEC_TIME_B = 'Execution Time (B)',
  PRECISION_B = 'Runtime Precision (B)',
  DELTA = 'Delta',
  RATIO = 'Ratio',
}

export class ExecutionConfiguration {
  modelName: string;
  datasetName: string;
  deviceName: string;
  batch?: number;
  nireq?: number;

  constructor(modelName: string, datasetName: string, deviceName: string, batch?: number, nireq?: number) {
    this.modelName = modelName;
    this.datasetName = datasetName;
    this.deviceName = deviceName;
    this.batch = batch;
    this.nireq = nireq;
  }

  get configurationName() {
    const projectName = [this.modelName, this.datasetName, this.deviceName].join(' • ');
    if (this.batch && this.nireq) {
      const executionDetails = `batch: ${this.batch}, nireq: ${this.nireq}`;
      return [projectName, executionDetails].join('\n');
    }
    return projectName;
  }
}
