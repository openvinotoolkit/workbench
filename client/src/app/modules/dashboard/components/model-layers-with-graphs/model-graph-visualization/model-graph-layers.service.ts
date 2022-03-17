import { Injectable } from '@angular/core';

import { isEmpty } from 'lodash';

import { ModelGraphType, ModelPrecisionEnum } from '@store/model-store/model.model';

import {
  NetronLayerMapping,
  NetronOpenvinoAttributeNames,
  NetronOpenvinoGraph,
  NetronOpenvinoInputOutputValue,
  NetronOpenvinoNode,
  NetronPrecisionMapping,
  OthersPrecisionLabel,
  PrecisionToLabelMap,
} from '@shared/models/netron';

@Injectable()
export class ModelGraphLayersService {
  // Netron layer elements prefixes
  static readonly netronNodeIdPrefix = 'node-name-';
  static readonly netronInputNodeIdPrefix = 'input-name-';
  static readonly netronNodeEdgeIdPrefix = 'edge-label-edge-';

  // Original graph specific fields
  private originalGraphLayers: NetronOpenvinoNode[] = [];
  private originalGraphInputLayers: NetronOpenvinoNode[] = [];

  // Runtime graph specific fields
  private runtimeGraphLayers: NetronOpenvinoNode[] = [];
  private runtimeGraphInputLayers: NetronOpenvinoNode[] = [];

  public runtimeToOriginalNodeIdsMap: NetronLayerMapping = {};

  private readonly othersPrecisionLabel = OthersPrecisionLabel;

  private readonly precisionNamesMap = {
    float32: ModelPrecisionEnum.FP32,
    float16: ModelPrecisionEnum.FP16,
    bfloat16: ModelPrecisionEnum.BF16,
    int64: ModelPrecisionEnum.I64,
    int32: ModelPrecisionEnum.I32,
    int8: ModelPrecisionEnum.I8,
    uint8: ModelPrecisionEnum.U8,
    int4: ModelPrecisionEnum.I4,
    uint4: ModelPrecisionEnum.U4,
    boolean: ModelPrecisionEnum.BOOL,
    bit: ModelPrecisionEnum.BIN,
  };

  private readonly notAvailablePrecision = '?';

  static isOriginalModelGraph(modelGraphType: ModelGraphType): boolean {
    if (![ModelGraphType.ORIGINAL, ModelGraphType.RUNTIME].includes(modelGraphType)) {
      throw Error(`Invalid model graph type: ${modelGraphType}`);
    }
    return modelGraphType === ModelGraphType.ORIGINAL;
  }

  public nodeIdToLayerName(nodeId: string): string | null {
    if (!nodeId) {
      return null;
    }
    return nodeId.replace(ModelGraphLayersService.netronNodeIdPrefix, '');
  }

  public layerNameToNodeId(layerName: string): string | null {
    return layerName ? `${ModelGraphLayersService.netronNodeIdPrefix}${layerName}` : layerName;
  }

  public getGraphLayers(modelGraphType: ModelGraphType): NetronOpenvinoNode[] {
    return ModelGraphLayersService.isOriginalModelGraph(modelGraphType)
      ? [...this.originalGraphInputLayers, ...this.originalGraphLayers]
      : [...this.runtimeGraphInputLayers, ...this.runtimeGraphLayers];
  }

  public setGraphLayers(modelGraphType: ModelGraphType, graph: NetronOpenvinoGraph): void {
    if (ModelGraphLayersService.isOriginalModelGraph(modelGraphType)) {
      this.originalGraphLayers = graph.nodes;
      this.originalGraphInputLayers = graph.inputs;
    } else {
      this.runtimeGraphLayers = graph.nodes;
      this.runtimeGraphInputLayers = graph.inputs;
    }
  }

  public getDefaultGraphLayers(modelGraphType: ModelGraphType, runtimeNode: string): string[] {
    const [defaultRuntimeLayerId] = this.getGraphInputLayersNames(ModelGraphType.RUNTIME).map((inputLayer) =>
      this.layerNameToNodeId(inputLayer)
    );
    return ModelGraphLayersService.isOriginalModelGraph(modelGraphType)
      ? this.runtimeToOriginalNodeIdsMap[runtimeNode]
      : [defaultRuntimeLayerId];
  }

  public getGraphInputLayers(modelGraphType: ModelGraphType): NetronOpenvinoNode[] {
    return ModelGraphLayersService.isOriginalModelGraph(modelGraphType)
      ? this.originalGraphInputLayers
      : this.runtimeGraphInputLayers;
  }

  public getGraphLayersNames(modelGraphType: ModelGraphType): string[] {
    return this.getGraphLayers(modelGraphType).map((layer) => layer.name);
  }

  public getGraphNodesIds(modelGraphType: ModelGraphType): string[] {
    return this.getGraphLayersNames(modelGraphType).map((layerName) => this.layerNameToNodeId(layerName));
  }

  public getGraphInputLayersNames(modelGraphType: ModelGraphType): string[] {
    return this.getGraphInputLayers(modelGraphType).map((inputLayer) => inputLayer.name);
  }

  public getLayerByNodeId(modelGraphType: ModelGraphType, nodeId: string): NetronOpenvinoNode {
    return this.getGraphLayers(modelGraphType).find((layer) => layer.name === this.nodeIdToLayerName(nodeId));
  }

  public getLayerShapeInformation(layer: NetronOpenvinoNode): NetronOpenvinoInputOutputValue[] {
    if (layer.attributes) {
      return !isEmpty(layer.outputs) ? layer.outputs.map((output) => output.arguments[0]) : [];
    }
    return layer.arguments;
  }

  public getLayerRuntimePrecisionMap(layer: NetronOpenvinoNode): NetronPrecisionMapping {
    const precision = layer.attributes
      ? NetronOpenvinoNode.getNodeAttributeValue(layer, NetronOpenvinoAttributeNames.RUNTIME_PRECISION)
      : layer.arguments[0].type._dataType;
    return { runtime: PrecisionToLabelMap[precision] ? precision : this.othersPrecisionLabel };
  }

  public getLayerOutputPrecisionMap(layer: NetronOpenvinoNode): NetronPrecisionMapping {
    const layerInfo = layer.attributes ? layer.outputs.map((output) => output.arguments[0]) : layer.arguments;
    return layerInfo.reduce((acc, { type, name }) => {
      acc[name] = PrecisionToLabelMap[type._dataType] ? type._dataType : this.othersPrecisionLabel;
      return acc;
    }, {});
  }

  public updateRuntimeToOriginalNodeIdsMap(): void {
    this.runtimeToOriginalNodeIdsMap = this.getGraphLayers(ModelGraphType.RUNTIME).reduce((acc, layer) => {
      const runtimeNodeId = this.layerNameToNodeId(layer.name);
      const originalLayerNamesAttributeValue = NetronOpenvinoNode.getNodeAttributeValue(
        layer,
        NetronOpenvinoAttributeNames.ORIGINAL_LAYERS_NAMES
      );
      if (originalLayerNamesAttributeValue) {
        acc[runtimeNodeId] = originalLayerNamesAttributeValue
          .split(',')
          .map((layerName) => this.layerNameToNodeId(layerName));
      } else {
        const originalNodesIds = this.getGraphInputLayersNames(ModelGraphType.RUNTIME).includes(layer.name)
          ? [runtimeNodeId]
          : [];
        acc[runtimeNodeId] = originalNodesIds;
      }
      return acc;
    }, {});
  }

  public getMappingNodesIdsFromGraphs(modelGraphType: ModelGraphType, nodeId: string): [string[], string[]] {
    const originalGraphMappingNodesIds = [];
    const reversedGraphMappingNodesIds = [];
    if (ModelGraphLayersService.isOriginalModelGraph(modelGraphType)) {
      const runtimeNodes = Object.keys(this.runtimeToOriginalNodeIdsMap);
      runtimeNodes.forEach((runtimeNode) => {
        if (this.runtimeToOriginalNodeIdsMap[runtimeNode].includes(nodeId)) {
          originalGraphMappingNodesIds.push(...this.runtimeToOriginalNodeIdsMap[runtimeNode]);
          reversedGraphMappingNodesIds.push(runtimeNode);
        }
      });
    } else {
      reversedGraphMappingNodesIds.push(...this.runtimeToOriginalNodeIdsMap[nodeId]);
    }
    originalGraphMappingNodesIds.push(nodeId);
    return [originalGraphMappingNodesIds, reversedGraphMappingNodesIds];
  }

  public changePrecisionNameOfLayers(modelGraphType: ModelGraphType): void {
    this.getGraphLayers(modelGraphType).forEach((layer) => {
      const { arguments: args, inputs, outputs } = layer;
      [args, inputs, outputs].forEach((property) => {
        if (isEmpty(property)) {
          return;
        }
        property.forEach((data) => {
          const type = args ? args[0].type : data.arguments[0].type;
          if (type) {
            type._dataType = this.precisionNamesMap[type._dataType] || this.notAvailablePrecision;
          }
        });
      });
    });
  }
}
