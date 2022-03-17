import { Injectable } from '@angular/core';

import { isNumber } from 'lodash';

import { IInferenceMatrix } from './inference-configuration-page.component';

@Injectable()
export class InferenceConfigurationService {
  generateInferenceMatrix(
    maxStream: number,
    streamsLength: number,
    maxBatch: number,
    batchesLength: number,
    batchRowsPower?: number
  ): IInferenceMatrix {
    const columns = this.range(1, maxStream + 1, streamsLength);
    const rows = this.range(1, maxBatch + 1, batchesLength, batchRowsPower);

    return {
      rowLabels: rows.map((row) => row.toString()),
      columnLabels: columns.map((column) => column.toString()),
      rows: rows.map((rowIndex) => columns.map((columnIndex) => ({ nireq: columnIndex, batch: rowIndex }))),
    };
  }

  private range(start: number, max: number, length: number, power?: number): number[] {
    const result = [];
    for (let i = start; i < max && result.length < length; i = isNumber(power) ? i * power : i + 1) {
      result.push(i);
    }
    return result;
  }
}
