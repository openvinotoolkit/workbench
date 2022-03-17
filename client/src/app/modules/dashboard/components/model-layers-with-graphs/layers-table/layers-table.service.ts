import { Injectable } from '@angular/core';
import { DecimalPipe } from '@angular/common';

import {
  cloneDeep,
  each,
  every,
  filter,
  find,
  includes,
  isArray,
  isEmpty,
  isEqual,
  isFinite,
  isNil,
  isNumber,
  isString,
  keys,
  map,
  reduce,
  sortBy,
  toLower,
} from 'lodash';
import { Dictionary } from '@ngrx/entity';

import { ModelPrecisionEnum } from '@store/model-store/model.model';

import {
  AppliedFilter,
  FilterableColumnOption,
  FilterableColumnOptions,
  ValueConditionOption,
  ValueConditionOptionsEnum,
  numberValueConditionToFunctionMap,
  numberValueConditionsMap,
} from '@shared/components/table-filter-form/filter-form.model';

import { ColumnNames, ExecutedLayerItem, OriginalIRLayerItem } from './layers-table.model';

const notExecutedValue = -100;

@Injectable()
export class LayersTableService {
  public placeholderTableColumn = '-';
  public notAvailableLabel = 'N/A';
  public notExecutedLabel = 'Not Executed';

  public valueConditionOptions: ValueConditionOption[] = [
    {
      name: `Equals "${this.notAvailableLabel}"`,
      value: ValueConditionOptionsEnum.EQUALS_NA,
    },
    {
      name: `Equals "${this.notExecutedLabel}"`,
      value: ValueConditionOptionsEnum.EQUALS_NOT_EXECUTED,
    },
    ...Object.values(numberValueConditionsMap),
  ];

  public filterableColumnOptions: FilterableColumnOptions = {
    [ColumnNames.LAYER_NAME]: [],
    [ColumnNames.LAYER_TYPE]: [],
    [ColumnNames.PRECISION]: [],
    [ColumnNames.PRECISION_B]: [],
  };

  constructor(private decimalPipe: DecimalPipe) {}

  static tableDataAccessor(data: ExecutedLayerItem, sortHeaderId: string): string | number {
    if ([ColumnNames.EXEC_ORDER, ColumnNames.LAYER_INFORMATION].includes(sortHeaderId as ColumnNames)) {
      return Number(data.details[0].executionParams.execOrder);
    }
    if (sortHeaderId === ColumnNames.EXEC_TIME) {
      const [execTime] = data[ColumnNames.EXEC_TIME];
      return isString(execTime) ? notExecutedValue : (execTime as number);
    }
    if (sortHeaderId === ColumnNames.EXEC_TIME_B) {
      const [, execTimeB] = data[ColumnNames.EXEC_TIME];
      return isString(execTimeB) ? notExecutedValue : (execTimeB as number);
    }
    if ([ColumnNames.PRECISION, ColumnNames.PRECISION_B].includes(sortHeaderId as ColumnNames)) {
      return data[sortHeaderId];
    }
    const value = data[sortHeaderId];
    if (isString(value)) {
      return toLower(value);
    }
    return isArray(value) ? value[0] : value;
  }

  private static _getExecutedLayerNameFromFusings(executedLayer: ExecutedLayerItem): string {
    const originalLayerNames = map(executedLayer.details[0].fusedLayers, (fusedLayer: OriginalIRLayerItem) => {
      return fusedLayer.layerName;
    });
    return sortBy(originalLayerNames).join('_');
  }

  public getExecTimeValue(execTimeParam: number | string): number | string {
    if (isFinite(execTimeParam)) {
      return this.decimalPipe.transform(execTimeParam, '1.0-5');
    }
    return isString(execTimeParam) ? this.notExecutedLabel : this.notAvailableLabel;
  }

  public customFilterPredicate(data: ExecutedLayerItem, appliedFilter: AppliedFilter): boolean {
    if (!appliedFilter) {
      return true;
    }
    const { filters } = appliedFilter;
    return every(filters, ({ column, value, valueCondition }) => {
      const filteredParam = LayersTableService.tableDataAccessor(data, column);
      if (valueCondition) {
        if (valueCondition === ValueConditionOptionsEnum.EQUALS_NOT_EXECUTED) {
          return (filteredParam as number) === notExecutedValue;
        }
        if (valueCondition === ValueConditionOptionsEnum.EQUALS_NA) {
          return isNil(filteredParam);
        }
        const numberValueConditionFunction = numberValueConditionToFunctionMap[valueCondition];
        if (!numberValueConditionFunction) {
          throw Error(`Corresponding function for value condition "${valueCondition}" not found`);
        }
        return numberValueConditionFunction(Number(filteredParam), value);
      }
      return includes(value as string[], filteredParam);
    });
  }

  public setUpFilterableColumnOptions(layers: ExecutedLayerItem[]): void {
    if (isEmpty(layers)) {
      return;
    }
    // Fill filterableColumnOptions on layers input change
    this.filterableColumnOptions[ColumnNames.LAYER_NAME] = [];
    this.filterableColumnOptions[ColumnNames.LAYER_TYPE] = [];
    layers.forEach((layer) => {
      const layerNameValue = LayersTableService.tableDataAccessor(layer, 'layerName') as string;
      const layerTypeValue = LayersTableService.tableDataAccessor(layer, 'layerType') as string;
      this.filterableColumnOptions[ColumnNames.LAYER_NAME].push(
        new FilterableColumnOption(layerNameValue, layer.layerName)
      );
      const layerTypes = this.filterableColumnOptions[ColumnNames.LAYER_TYPE];
      if (!map(layerTypes, 'value').includes(layerTypeValue)) {
        this.filterableColumnOptions[ColumnNames.LAYER_TYPE].push(
          new FilterableColumnOption(layerTypeValue, layer.layerType)
        );
      }
    });
  }

  public setUpPrecisionFilterableColumnOptions(
    layersA: ExecutedLayerItem[] = [],
    layersB: ExecutedLayerItem[] = []
  ): void {
    const getPrecisions = (layers: ExecutedLayerItem[]): FilterableColumnOption[] => {
      const precisionsSet = new Set<keyof typeof ModelPrecisionEnum>(
        layers.map((layer) => layer.runtimePrecision).filter((layer) => layer)
      );
      return [
        new FilterableColumnOption(null, this.notAvailableLabel),
        ...Array.from(precisionsSet).map((precision) => new FilterableColumnOption(ModelPrecisionEnum[precision])),
      ];
    };

    this.filterableColumnOptions[ColumnNames.PRECISION] = getPrecisions(layersA);
    this.filterableColumnOptions[ColumnNames.PRECISION_B] = getPrecisions(layersB);
  }

  public joinExecNetworksForComparison(
    execLayersA: ExecutedLayerItem[],
    execLayersB: ExecutedLayerItem[],
    doPointsBelongToSameProject = false
  ): ExecutedLayerItem[] {
    const joinedLayers = cloneDeep(execLayersA);

    const findLayer = (name): ExecutedLayerItem => find(joinedLayers, (l: ExecutedLayerItem) => l.layerName === name);

    const findFusings = (layer) => map(layer.details[0].fusedLayers, 'layerName');

    const execLayerAFusing = reduce(
      execLayersA,
      (acc, layerA) => {
        acc[layerA.layerName] = findFusings(layerA);
        return acc;
      },
      {}
    );

    const commonFuses = this._getCommonFusings(execLayersA);

    each(execLayersB, (execLayerB: ExecutedLayerItem) => {
      const fusedLayersFromLayerB = findFusings(execLayerB);

      const isPresentInAName = doPointsBelongToSameProject
        ? execLayerB.layerName
        : find(keys(execLayerAFusing), (key) => {
            return (
              fusedLayersFromLayerB.length > 0 &&
              execLayerAFusing[key].length > 0 &&
              isEqual(sortBy(fusedLayersFromLayerB), sortBy(execLayerAFusing[key]))
            );
          });

      const executedLayerBName = LayersTableService._getExecutedLayerNameFromFusings(execLayerB);
      const isALayerSplitByHardwarePlugin =
        !commonFuses[executedLayerBName] && execLayerB.details[0].fusedLayers.length > 0;

      if (isPresentInAName && !isALayerSplitByHardwarePlugin) {
        const joinedLayer: ExecutedLayerItem = findLayer(isPresentInAName);
        joinedLayer.layerNameB = execLayerB.layerName;
        joinedLayer.runtimePrecisionB = execLayerB.runtimePrecision;
        joinedLayer.execTime.push(execLayerB.execTime[0]);
        joinedLayer.details.push(execLayerB.details[0]);
        joinedLayer.delta = null;
        joinedLayer.ratio = null;

        const execTimeA = joinedLayer.execTime[0];
        const execTimeB = execLayerB.execTime[0];
        if (!isNumber(execTimeA) || !isNumber(execTimeB)) {
          return;
        }

        joinedLayer.delta = Number((execTimeB - execTimeA).toFixed(5));
        joinedLayer.ratio = execTimeA ? Number((execTimeB / execTimeA).toFixed(5)) : null;
        return;
      }

      const newLayerB = cloneDeep(execLayerB);
      newLayerB.execTime.unshift(null);
      newLayerB.details.unshift(null);
      newLayerB.delta = null;
      newLayerB.ratio = null;
      newLayerB.layerNameB = execLayerB.layerName;
      newLayerB.runtimePrecision = null;
      newLayerB.runtimePrecisionB = execLayerB.runtimePrecisionB;
      joinedLayers.push(newLayerB);
    });

    const uniqueLayersA = filter(joinedLayers, (layer: ExecutedLayerItem) => {
      return layer.runtimePrecision && !layer.runtimePrecisionB;
    });

    each(uniqueLayersA, (joinedLayer: ExecutedLayerItem) => {
      joinedLayer.runtimePrecisionB = null;
      joinedLayer.execTime.push(null);
      joinedLayer.details.push(null);
      joinedLayer.delta = null;
      joinedLayer.layerNameB = null;
    });

    return joinedLayers;
  }

  private _getCommonFusings(executedLayers: ExecutedLayerItem[]): Dictionary<string[]> {
    const commonFuses = reduce(
      executedLayers,
      (acc, executedLayer: ExecutedLayerItem) => {
        const executedLayerName = LayersTableService._getExecutedLayerNameFromFusings(executedLayer);
        if (!executedLayerName) {
          return acc;
        }

        if (!acc[executedLayerName]) {
          acc[executedLayerName] = [];
        }
        acc[executedLayerName].push(executedLayer.layerName);
        return acc;
      },
      {}
    );

    const namesOfFrequentFuses = filter(keys(commonFuses), (fuse) => commonFuses[fuse].length > 0);

    return reduce(
      executedLayers,
      (acc, executedLayer: ExecutedLayerItem) => {
        const executedLayerName = LayersTableService._getExecutedLayerNameFromFusings(executedLayer);
        if (!namesOfFrequentFuses.includes(executedLayerName)) {
          return acc;
        }
        if (!acc[executedLayerName]) {
          acc[executedLayerName] = [];
        }
        acc[executedLayerName].push(executedLayer.layerName);
        return acc;
      },
      {}
    );
  }
}
