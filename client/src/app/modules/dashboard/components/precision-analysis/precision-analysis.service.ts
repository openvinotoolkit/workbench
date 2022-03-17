import { Injectable } from '@angular/core';

import { filter, find } from 'lodash';

import { ModelPrecisionEnum } from '@store/model-store/model.model';
import {
  ExecutedModelLayers,
  IComparisonLayerDistribution,
  ILayerTimePrecisionDistribution,
  ILayerTimePrecisionDistributionTableData,
  IPrecisionDistribution,
  IRuntimePrecisionDistribution,
} from '@store/inference-result-store/inference-result.model';

import { ExecutedLayerItem } from '../model-layers-with-graphs/layers-table/layers-table.model';
import { taggedLayerNamesRegex } from '../../constants';

@Injectable({
  providedIn: 'root',
})
export class PrecisionAnalysisService {
  private calculateTotalExecTimeByLayers(layers: ExecutedLayerItem[]): number {
    return layers.reduce((acc, { execTime }) => (execTime[0] === 'not_executed' ? acc : acc + Number(execTime[0])), 0);
  }
  public unquantizedConvLayesPresent(layers: ExecutedLayerItem[]): boolean {
    return layers.some(
      ({ layerType, runtimePrecision }: ExecutedLayerItem) =>
        layerType === ExecutedModelLayers.CONVOLUTION &&
        (runtimePrecision === ModelPrecisionEnum.FP32 || runtimePrecision === ModelPrecisionEnum.I32)
    );
  }

  public calculateReordersShare(layerDistributionInfo: ILayerTimePrecisionDistribution[]): number {
    const totalExecTime = layerDistributionInfo.reduce((acc, el) => acc + el.execTime, 0);
    const reorderLayers = filter(
      layerDistributionInfo,
      (layerInfo: ILayerTimePrecisionDistribution) => layerInfo.layerType === ExecutedModelLayers.REORDER
    );
    const reorderLayersExecTime = reorderLayers.reduce((acc, layer) => acc + layer.execTime, 0);
    return +(reorderLayersExecTime / totalExecTime).toFixed(2);
  }

  public calculateInt8Share(layers: ExecutedLayerItem[]): number {
    const totalExecTime = this.calculateTotalExecTimeByLayers(layers);
    const int8Layers = filter(layers, (layer) =>
      [ModelPrecisionEnum.U8, ModelPrecisionEnum.I8].includes(layer.runtimePrecision)
    );
    const reorderLayersExecTime = int8Layers.reduce(
      (acc, { execTime }) => (execTime[0] === 'not_executed' ? acc : acc + Number(execTime[0])),
      0
    );
    return Number((reorderLayersExecTime / totalExecTime).toFixed(2));
  }

  public calculateFP16Share(layers: ExecutedLayerItem[]): number {
    const totalExecTime = this.calculateTotalExecTimeByLayers(layers);
    const fp16Layers = filter(layers, (layer) =>
      [ModelPrecisionEnum.FP16, ModelPrecisionEnum.I16].includes(layer.runtimePrecision)
    );
    const fp16LayersExecTime = fp16Layers.reduce(
      (acc, { execTime }) => (execTime[0] === 'not_executed' ? acc : acc + Number(execTime[0])),
      0
    );
    return Number((fp16LayersExecTime / totalExecTime).toFixed(2));
  }

  public calculateFPConvShare(layers: ExecutedLayerItem[]): number {
    const totalExecTime = this.calculateTotalExecTimeByLayers(layers);
    const fpConvLayers = filter(
      layers,
      ({ layerType, runtimePrecision }) =>
        layerType === ExecutedModelLayers.CONVOLUTION &&
        ![ModelPrecisionEnum.U8, ModelPrecisionEnum.I8].includes(runtimePrecision)
    );
    const fpConvLayersExecTime = fpConvLayers.reduce(
      (acc, { execTime }) => (execTime[0] === 'not_executed' ? acc : acc + Number(execTime[0])),
      0
    );
    return Number((fpConvLayersExecTime / totalExecTime).toFixed(2));
  }

  public calculatePrecisionDistribution(
    layerPrecisionDistributionInfo: ILayerTimePrecisionDistribution[]
  ): { [key in ModelPrecisionEnum]?: number } {
    const totalLayers = layerPrecisionDistributionInfo.reduce((acc, el) => acc + el.total, 0);
    const precisionDistribution: { [key in ModelPrecisionEnum]?: number } = {
      [ModelPrecisionEnum.FP32]: 0,
      [ModelPrecisionEnum.FP16]: 0,
      [ModelPrecisionEnum.I8]: 0,
    };

    layerPrecisionDistributionInfo.forEach((layerInfo: ILayerTimePrecisionDistribution) => {
      Object.keys(layerInfo.runtimePrecisions).forEach((precision: ModelPrecisionEnum) => {
        precisionDistribution[precision] += Number((layerInfo.runtimePrecisions[precision] / totalLayers).toFixed(2));
      });
    });

    return precisionDistribution;
  }

  public getPrecisionDistributionTableData(precisionsInfo: IRuntimePrecisionDistribution): IPrecisionDistribution[] {
    const totalExecTime = Object.values(precisionsInfo).reduce((a, b) => a + b.execTime, 0);
    return Object.values(precisionsInfo).map(({ precision, execTime }) => {
      return {
        precision,
        total: (execTime / totalExecTime) * 100,
        isDisplayed: true,
      };
    });
  }

  public getLayerDistributionTableData(
    layerTimePrecisionDistribution: ILayerTimePrecisionDistribution[]
  ): ILayerTimePrecisionDistributionTableData[] {
    const totalExecTime = layerTimePrecisionDistribution.reduce((a, b) => a + b.execTime, 0);
    return layerTimePrecisionDistribution.map(
      ({ layerType, execTime, runtimePrecisions }: ILayerTimePrecisionDistribution) => {
        return {
          layerType: layerType.replace(taggedLayerNamesRegex, ''),
          execTime,
          total: (execTime / totalExecTime) * 100,
          runtimePrecisions,
          isDisplayed: true,
        };
      }
    );
  }

  public getLayersDistributionComparisonData(
    layerTimeDistributionA: ILayerTimePrecisionDistribution[],
    layerTimeDistributionB: ILayerTimePrecisionDistribution[]
  ): IComparisonLayerDistribution[] {
    const totalExecTimeA = layerTimeDistributionA.reduce((a, b) => a + b.execTime, 0);
    const totalExecTimeB = layerTimeDistributionB.reduce((a, b) => a + b.execTime, 0);
    let tableData = layerTimeDistributionA.map((layerInfo: ILayerTimePrecisionDistribution) => {
      const layerInfoB = find(
        layerTimeDistributionB,
        (layerB: ILayerTimePrecisionDistribution) => layerB.layerType === layerInfo.layerType
      );
      return {
        layerType: layerInfo.layerType.replace(taggedLayerNamesRegex, ''),
        execTime: layerInfo.execTime,
        total: totalExecTimeA ? (layerInfo.execTime / totalExecTimeA) * 100 : 0,
        execTimeB: layerInfoB?.execTime || 0,
        totalB: layerInfoB && totalExecTimeB ? (layerInfoB?.execTime / totalExecTimeB) * 100 : 0,
        runtimePrecisions: layerInfo.runtimePrecisions,
        runtimePrecisionsB: layerInfoB?.runtimePrecisions,
        isDisplayed: true,
      };
    });

    layerTimeDistributionB.forEach((layerInfo: ILayerTimePrecisionDistribution) => {
      const layerType = layerInfo.layerType.replace(taggedLayerNamesRegex, '');
      const existingLayerData = find(tableData, (row: IComparisonLayerDistribution) => row.layerType === layerType);
      if (existingLayerData) {
        return;
      }
      tableData = [
        ...tableData,
        {
          layerType,
          execTime: 0,
          total: 0,
          execTimeB: layerInfo.execTime,
          totalB: (layerInfo.execTime / totalExecTimeB) * 100,
          runtimePrecisions: null,
          runtimePrecisionsB: layerInfo.runtimePrecisions,
          isDisplayed: true,
        },
      ];
    });
    return tableData;
  }

  sortColumn(
    columnName: string,
    a: IComparisonLayerDistribution | ILayerTimePrecisionDistributionTableData,
    b: IComparisonLayerDistribution | ILayerTimePrecisionDistributionTableData
  ): -1 | 1 {
    switch (columnName) {
      case 'total':
        return a.total > b.total ? 1 : -1;
      case 'execTime':
        return a.execTime > b.execTime ? 1 : -1;
      case ModelPrecisionEnum.FP32:
        return (a.runtimePrecisions?.FP32 || 0) > (b.runtimePrecisions?.FP32 || 0) ? 1 : -1;
      case ModelPrecisionEnum.FP16:
        return (a.runtimePrecisions?.FP16 || 0) > (b.runtimePrecisions?.FP16 || 0) ? 1 : -1;
      case ModelPrecisionEnum.I8:
        return (a.runtimePrecisions?.I8 || 0) > (b.runtimePrecisions.I8 || 0) ? 1 : -1;
    }
  }
}
