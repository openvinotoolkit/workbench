import { ModelPrecisionEnum } from '@store/model-store/model.model';

import { WorkbenchBrowserFileContext } from '../../modules/dashboard/components/model-layers-with-graphs/model-graph-visualization/netron-graph/lib/browser-file-context';

interface NetronBaseModel {
  name: string;
  format: string;
  graphs: object[];
}

export const NotExecutedLayerColor = '#d4d4d4';
export const GraphExecTimeColors = ['#63be7d', '#9ed07f', '#b9d580', '#f4e87f', '#fdd480', '#f67d71'];

export const NotExecutedLabel = 'Not Executed';
export const OthersPrecisionLabel = 'Others';

export const ExecutionTimeToColorMap = {
  [NotExecutedLabel]: NotExecutedLayerColor,
};

export const PrecisionToLabelMap = {
  [ModelPrecisionEnum.FP32]: ModelPrecisionEnum.FP32,
  [ModelPrecisionEnum.FP16]: `${ModelPrecisionEnum.FP16} ${ModelPrecisionEnum.BF16}`,
  [ModelPrecisionEnum.BF16]: `${ModelPrecisionEnum.FP16} ${ModelPrecisionEnum.BF16}`,
  [ModelPrecisionEnum.I8]: `${ModelPrecisionEnum.I8} ${ModelPrecisionEnum.U8}`,
  [ModelPrecisionEnum.U8]: `${ModelPrecisionEnum.I8} ${ModelPrecisionEnum.U8}`,
  [ModelPrecisionEnum.I32]: `${ModelPrecisionEnum.I32} ${ModelPrecisionEnum.I64}`,
  [ModelPrecisionEnum.I64]: `${ModelPrecisionEnum.I32} ${ModelPrecisionEnum.I64}`,
  [OthersPrecisionLabel]: OthersPrecisionLabel,
};

export const PrecisionLabelToColorMap = {
  [ModelPrecisionEnum.FP32]: '#ebb04b',
  [`${ModelPrecisionEnum.FP16} ${ModelPrecisionEnum.BF16}`]: '#fff280',
  [`${ModelPrecisionEnum.I8} ${ModelPrecisionEnum.U8}`]: '#91bbd5',
  [`${ModelPrecisionEnum.I32} ${ModelPrecisionEnum.I64}`]: '#aebad8',
  [OthersPrecisionLabel]: NotExecutedLayerColor,
};

export interface NetronOpenvinoModel extends NetronBaseModel {
  graphs: NetronOpenvinoGraph[];
}

export interface NetronOpenvinoGraph {
  name: string;
  nodes: NetronOpenvinoNode[];
  inputs: NetronOpenvinoNode[];
  outputs: object[];
  arguments: object;
}

export interface NetronLayerMapping {
  [id: string]: string[];
}

export interface NetronPrecisionMapping {
  [name: string]: ModelPrecisionEnum | string;
}

export class NetronOpenvinoNode {
  id: string;
  name: string;
  type: NetronOpenvinoType;
  arguments: NetronOpenvinoInputOutputValue[];
  inputs: NetronOpenvinoInputOutput[];
  outputs: NetronOpenvinoInputOutput[];
  attributes: NetronOpenvinoAttribute[];

  static getNodeAttribute(
    node: NetronOpenvinoNode,
    attributeName: NetronOpenvinoAttributeNames
  ): NetronOpenvinoAttribute {
    return node.attributes?.find(({ name }) => name === attributeName);
  }

  static getNodeAttributeValue(node: NetronOpenvinoNode, attributeName: NetronOpenvinoAttributeNames): string {
    return NetronOpenvinoNode.getNodeAttribute(node, attributeName)?.value;
  }
}

export interface NetronOpenvinoType {
  name: string;
  category?: string;
}

export interface NetronOpenvinoAttribute {
  name: NetronOpenvinoAttributeNames;
  value: string;
}

export const enum NetronOpenvinoAttributeNames {
  EXECUTION_TIME_MCS = 'execTimeMcs',
  ORIGINAL_LAYERS_NAMES = 'originalLayersNames',
  RUNTIME_PRECISION = 'runtimePrecision',
}

export enum GraphFormatsToDownload {
  PNG = 'png',
  SVG = 'svg',
}

export enum GraphColoring {
  BY_LAYER_TYPE = 'byLayerType',
  BY_EXECUTION_TIME = 'byExecutionTime',
  BY_RUNTIME_PRECISION = 'byRuntimePrecision',
  BY_OUTPUT_PRECISION = 'byOutputPrecision',
}

export enum GraphColoringLabels {
  BY_LAYER_TYPE = 'By Layer Type',
  BY_EXECUTION_TIME = 'By Execution Time',
  BY_RUNTIME_PRECISION = 'By Runtime Precision',
  BY_OUTPUT_PRECISION = 'By Output Precision',
}

export interface NetronOpenvinoInputOutput {
  name: string;
  arguments: NetronOpenvinoInputOutputValue[];
}

export interface NetronOpenvinoInputOutputValue {
  initializer: NetronOpenvinoInputOutputInitializer;
  name: string;
  type: NetronOpenvinoInputOutputType;
}

export interface NetronOpenvinoInputOutputInitializer {
  kind: string;
}

export interface NetronOpenvinoInputOutputType {
  _dataType: string;
  shape: NetronOpenvinoTensorShape;
}

export interface NetronOpenvinoTensorShape {
  dimensions: number[];
}

export interface NetronViewSidebar {
  _id: string;
  _closeSidebarHandler: () => void;
  _closeSidebarKeyDownHandler: () => void;
  open: (content: HTMLElement, title: string) => void;
  close: () => void;
}

export interface NetronGraphZoom {
  transform: (selection: object, transform: object) => void;
}

export interface NetronView {
  open: (fileContext: WorkbenchBrowserFileContext) => Promise<NetronOpenvinoModel>;
  find: () => void;
  select: (selection: Element[]) => void;
  clearSelection: () => void;
  showModelProperties: () => void;
  showNodeProperties: (node: NetronOpenvinoNode) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  export: (file: string) => void;
  _graphs: NetronOpenvinoGraph[];
  _selection: SVGElement[];
  _sidebar: NetronViewSidebar;
  _model: NetronOpenvinoModel;
  _searchText: string;
  _zoom: NetronGraphZoom;
}
