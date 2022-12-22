import { Component, ChangeDetectionStrategy, ViewChild, AfterViewInit, Input } from '@angular/core';
import { MatLegacyTableDataSource as MatTableDataSource } from '@angular/material/legacy-table';
import { MatSort, Sort } from '@angular/material/sort';

import { maxBy, filter } from 'lodash';

import {
  IRuntimePrecisionDistribution,
  IPrecisionDistribution,
} from '@store/inference-result-store/inference-result.model';

import { PrecisionAnalysisService } from '../precision-analysis.service';

@Component({
  selector: 'wb-precision-distribution',
  templateUrl: './precision-distribution.component.html',
  styleUrls: ['./precision-distribution.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrecisionDistributionComponent implements AfterViewInit {
  private _precisions: IRuntimePrecisionDistribution = null;
  @Input() set precisions(value: IRuntimePrecisionDistribution) {
    if (!value) {
      return;
    }
    this._precisions = value;
    this.dataSource.data = this.precisionAnalysisService.getPrecisionDistributionTableData(this._precisions);
    this.maxScore = maxBy(this.dataSource.data, 'total').total;
  }

  @ViewChild(MatSort) private _sort: MatSort;

  displayedColumns = ['precision', 'total', 'bar', 'isDisplayed'];

  dataSource: MatTableDataSource<IPrecisionDistribution> = new MatTableDataSource<IPrecisionDistribution>([]);

  maxScore: number;

  public sortedColumn: Sort = { active: 'total', direction: 'desc' };

  constructor(private precisionAnalysisService: PrecisionAnalysisService) {}

  ngAfterViewInit(): void {
    this.dataSource.sort = this._sort;
  }

  redisplayRatioBar(element, display: boolean): void {
    element.isDisplayed = display;
    const displayedScores = filter(this.dataSource.data, (el: IPrecisionDistribution) => el.isDisplayed);
    this.maxScore = maxBy(displayedScores, 'total')?.total;
  }
}
