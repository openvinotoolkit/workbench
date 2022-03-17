import {
  Component,
  ChangeDetectionStrategy,
  ViewChild,
  AfterViewInit,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SortDirection } from '@angular/material/sort/sort-direction';

import { filter, maxBy, find, isArray } from 'lodash';

import { MessagesService } from '@core/services/common/messages.service';

import {
  IComparisonLayerDistribution,
  ILayerTimePrecisionDistribution,
} from '@store/inference-result-store/inference-result.model';
import { ModelPrecisionEnum } from '@store/model-store/model.model';

import { RATIO_BAR_COLOR_SCHEME_DEFAULT, RATIO_BAR_COLOR_SCHEME_A, RATIO_BAR_COLOR_SCHEME_B } from '../../../constants';
import { PrecisionAnalysisService } from '../precision-analysis.service';

enum ColorSchemes {
  A = 'A',
  B = 'B',
}

@Component({
  selector: 'wb-layers-distribution-comparison',
  templateUrl: './layers-distribution-comparison.component.html',
  styleUrls: ['./layers-distribution-comparison.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayersDistributionComparisonComponent implements AfterViewInit, OnChanges {
  @Input()
  layerTimeDistributionA: ILayerTimePrecisionDistribution[];

  @Input()
  layerTimeDistributionB: ILayerTimePrecisionDistribution[];

  @ViewChild(MatSort) private _sort: MatSort;

  public readonly notAvailableLabel = 'N/A';

  public sortedColumn: Sort = { active: 'total', direction: 'desc' };

  precisionColumnTips = this.messagesService.hintMessages.precisionColumn;

  displayedColumns = [
    'projectNum',
    'layerType',
    ModelPrecisionEnum.FP32,
    ModelPrecisionEnum.FP16,
    ModelPrecisionEnum.I8,
    'total',
    'bar',
    'isDisplayed',
  ];

  modelPrecisions = ModelPrecisionEnum;

  colorScheme = ColorSchemes;

  colorSchemeMap = {
    [ColorSchemes.A]: RATIO_BAR_COLOR_SCHEME_A,
    [ColorSchemes.B]: RATIO_BAR_COLOR_SCHEME_B,
  };

  dataSource: MatTableDataSource<IComparisonLayerDistribution> = new MatTableDataSource<IComparisonLayerDistribution>(
    []
  );

  ngAfterViewInit(): void {
    this.dataSource.sort = this._sort;
    this.dataSource.sortData = (data: IComparisonLayerDistribution[], sort: MatSort) => {
      const direction: SortDirection = sort.direction;
      return data.sort(
        (a: IComparisonLayerDistribution, b: IComparisonLayerDistribution) =>
          this.precisionAnalysticsService.sortColumn(sort.active, a, b) * (direction === 'asc' ? 1 : -1)
      );
    };
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!isArray(this.layerTimeDistributionA) || !isArray(this.layerTimeDistributionB)) {
      return;
    }
    this.dataSource.data = this.precisionAnalysticsService.getLayersDistributionComparisonData(
      this.layerTimeDistributionA,
      this.layerTimeDistributionB
    );
  }

  constructor(private precisionAnalysticsService: PrecisionAnalysisService, private messagesService: MessagesService) {}

  get maxScore(): number {
    const displayedScores = filter(this.dataSource.data, (el: IComparisonLayerDistribution) => el.isDisplayed);
    return Math.max(maxBy(displayedScores, 'total')?.total, maxBy(displayedScores, 'totalB')?.totalB);
  }

  getColorForLayer(layer: string, colorScheme: ColorSchemes.A | ColorSchemes.B): number {
    return this.colorSchemeMap[colorScheme][layer.toUpperCase()] || RATIO_BAR_COLOR_SCHEME_DEFAULT.DEFAULT;
  }
}
