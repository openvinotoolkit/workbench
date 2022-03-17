import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { isEmpty } from 'lodash';

@Component({
  selector: 'wb-heatmap',
  templateUrl: './heatmap.component.html',
  styleUrls: ['./heatmap.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeatmapComponent {
  @Input()
  public intervals: number[][];

  public readonly intervalBlockClassName = 'interval-block-color';

  get labels(): string[] {
    if (isEmpty(this.intervals)) {
      return [];
    }
    const maxExecutionTimeMs = this.intervals[this.intervals.length - 1][1];
    const executionTimePrecision = this.getExecutionTimePrecision(maxExecutionTimeMs);
    return this.intervals.map(
      ([from, to]) =>
        `${Number(from.toFixed(executionTimePrecision))} - \n${Number(to.toFixed(executionTimePrecision))}`
    );
  }

  public getExecutionTimePrecision(maxExecutionTime: number): number {
    return maxExecutionTime < 1 ? 4 : maxExecutionTime < 1000 ? 3 : 0;
  }
}
