import { Component, ChangeDetectionStrategy, ViewChild, AfterViewInit, Input } from '@angular/core';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SortDirection } from '@angular/material/sort';

import { filter, maxBy, isEmpty } from 'lodash';

import { MessagesService } from '@core/services/common/messages.service';

import {
  ILayerTimePrecisionDistribution,
  ILayerTimePrecisionDistributionTableData,
} from '@store/inference-result-store/inference-result.model';
import { ModelPrecisionEnum } from '@store/model-store/model.model';

import { RATIO_BAR_COLOR_SCHEME_DEFAULT } from '../../../constants';
import { PrecisionAnalysisService } from '../precision-analysis.service';

@Component({
  selector: 'wb-layers-distribution',
  templateUrl: './layers-distribution.component.html',
  styleUrls: ['./layers-distribution.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayersDistributionComponent implements AfterViewInit {
  private _layerTimePrecisionDistribution: ILayerTimePrecisionDistribution[];
  @Input() set layerTimePrecisionDistribution(value: ILayerTimePrecisionDistribution[]) {
    if (isEmpty(value)) {
      return;
    }
    this._layerTimePrecisionDistribution = value;

    this.dataSource.data = this.precisionAnalysticsService.getLayerDistributionTableData(
      this._layerTimePrecisionDistribution
    );

    if (this._sort) {
      this._sort.sort({ id: 'total', start: 'asc', disableClear: false });
    }
  }

  @Input()
  public set expanded(value: boolean) {
    this._expanded = value;
    if (this._expanded) {
      this.displayedColumns = [
        'layerType',
        'total',
        ModelPrecisionEnum.FP32,
        ModelPrecisionEnum.FP16,
        ModelPrecisionEnum.I8,
        'bar',
        'isDisplayed',
      ];
      return;
    }
    this.displayedColumns = ['layerType', 'total', 'bar', 'isDisplayed'];
  }

  @ViewChild(MatSort) private _sort: MatSort;

  public sortedColumn: Sort = { active: 'total', direction: 'desc' };

  displayedColumns: string[];
  modelPrecisions = ModelPrecisionEnum;
  precisionColumnTips = this.messagesService.hintMessages.precisionColumn;
  public readonly notAvailableLabel = 'N/A';

  dataSource: MatTableDataSource<ILayerTimePrecisionDistributionTableData> =
    new MatTableDataSource<ILayerTimePrecisionDistributionTableData>([]);
  private _expanded = false;

  ngAfterViewInit(): void {
    this.dataSource.sort = this._sort;
    this.dataSource.sortData = (data: ILayerTimePrecisionDistributionTableData[], sort: MatSort) => {
      const direction: SortDirection = sort.direction;
      return data.sort(
        (a: ILayerTimePrecisionDistributionTableData, b: ILayerTimePrecisionDistributionTableData) =>
          this.precisionAnalysticsService.sortColumn(sort.active, a, b) * (direction === 'asc' ? 1 : -1)
      );
    };
  }

  constructor(private precisionAnalysticsService: PrecisionAnalysisService, private messagesService: MessagesService) {}

  get maxScore(): number {
    const displayedScores = filter(
      this.dataSource.data,
      (el: ILayerTimePrecisionDistributionTableData) => el.isDisplayed
    );
    return maxBy(displayedScores, 'total')?.total;
  }

  getColorForLayer(layer: string): number {
    return RATIO_BAR_COLOR_SCHEME_DEFAULT[layer.toUpperCase()] || RATIO_BAR_COLOR_SCHEME_DEFAULT.DEFAULT;
  }
}
