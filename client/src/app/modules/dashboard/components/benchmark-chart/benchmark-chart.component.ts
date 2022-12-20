import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  LOCALE_ID,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';

import { Chart, ChartData, ChartOptions, ChartPoint, ChartTooltipItem, PointStyle } from 'chart.js';
import { each, filter, findIndex, get, isEmpty, isNil, map, maxBy, minBy, set, sortBy } from 'lodash';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { Categories, GAActions, GoogleAnalyticsService } from '@core/services/common/google-analytics.service';

import { IInferenceResult } from '@store/inference-history-store/inference-history.model';
import { ProjectItem } from '@store/project-store/project.model';
import { IInferenceExecutionInfo } from '@store/inference-result-store/inference-result.model';
import { THROUGHPUT_UNIT } from '@store/model-store/model.model';

import { isVPU } from '@shared/models/device';
import { AdvancedConfigField } from '@shared/components/config-form-field/config-form-field.component';

import { borderLinePlugin } from './chartjs-line-plugin';
import { COMPARISON_CHART_COLOR, POINT_STYLES } from '../../constants';

enum CHART_POINT_TYPE {
  NOT_SELECTED = 'not-selected',
  SELECTED = 'selected',
}

interface IBenchmarkChartPoint extends ChartPoint {
  batch: number;
  nireq: number;
  type: CHART_POINT_TYPE;
  inferenceId: number;
  throughputUnit: THROUGHPUT_UNIT;
}

const execInfoToChartPoint = (result: IInferenceResult): IBenchmarkChartPoint => {
  return {
    x: result.latency,
    y: result.throughput,
    batch: result.batch,
    nireq: result.nireq,
    type: CHART_POINT_TYPE.NOT_SELECTED,
    inferenceId: result.id,
    throughputUnit: result.throughputUnit,
  };
};

const execInfoToChartPoints = (results: IInferenceResult[]): IBenchmarkChartPoint[] => {
  return sortBy(map(results, execInfoToChartPoint), 'x');
};

interface IPointOptions {
  backgroundColor: COMPARISON_CHART_COLOR;
  pointRadius: number;
  type: CHART_POINT_TYPE;
  pointStyle: PointStyle | HTMLImageElement;
}

interface IPointOptionsSet {
  line: IPointOptions;
  selected: IPointOptions;
  sweetSpot: IPointOptions;
  selectedSweetSpot: IPointOptions;
}

const POINTS_OPTION_SETS: { A: IPointOptionsSet; B: IPointOptionsSet } = {
  A: {
    line: {
      backgroundColor: COMPARISON_CHART_COLOR.DEFAULT_LINE,
      pointRadius: 5,
      type: CHART_POINT_TYPE.NOT_SELECTED,
      pointStyle: 'circle',
    },
    sweetSpot: {
      backgroundColor: COMPARISON_CHART_COLOR.SWEET_SPOT,
      pointRadius: 7,
      type: CHART_POINT_TYPE.NOT_SELECTED,
      pointStyle: POINT_STYLES.SWEET_SPOT_POINT_DEFAULT,
    },
    selectedSweetSpot: {
      backgroundColor: COMPARISON_CHART_COLOR.DEFAULT_LINE,
      pointRadius: 7,
      type: CHART_POINT_TYPE.NOT_SELECTED,
      pointStyle: POINT_STYLES.SWEET_SPOT_POINT_A,
    },
    selected: {
      backgroundColor: COMPARISON_CHART_COLOR.FIRST_SELECTED_POINT,
      pointRadius: 7,
      type: CHART_POINT_TYPE.SELECTED,
      pointStyle: POINT_STYLES.POINT_A,
    },
  },
  B: {
    line: {
      backgroundColor: COMPARISON_CHART_COLOR.DEFAULT_LINE,
      pointRadius: 5,
      type: CHART_POINT_TYPE.NOT_SELECTED,
      pointStyle: 'rect',
    },
    sweetSpot: {
      backgroundColor: COMPARISON_CHART_COLOR.SWEET_SPOT,
      pointRadius: 7,
      type: CHART_POINT_TYPE.NOT_SELECTED,
      pointStyle: POINT_STYLES.SWEET_SPOT_POINT_DEFAULT,
    },
    selectedSweetSpot: {
      backgroundColor: COMPARISON_CHART_COLOR.SWEET_SPOT,
      pointRadius: 7,
      type: CHART_POINT_TYPE.NOT_SELECTED,
      pointStyle: POINT_STYLES.SWEET_SPOT_POINT_B,
    },
    selected: {
      backgroundColor: COMPARISON_CHART_COLOR.SECOND_SELECTED_POINT,
      pointRadius: 7,
      type: CHART_POINT_TYPE.SELECTED,
      pointStyle: POINT_STYLES.POINT_B,
    },
  },
};

@Component({
  selector: 'wb-benchmark-chart',
  templateUrl: './benchmark-chart.component.html',
  styleUrls: ['./benchmark-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BenchmarkChartComponent implements OnInit, OnChanges, OnDestroy {
  @Input() public project: ProjectItem = null;

  @Input() public inferenceResults: IInferenceResult[] = [];

  @Input() public mode: 'a' | 'b' = null;

  @Input() public normalizationResults: IInferenceResult[] = null;

  private _expanded = false;
  @Input()
  public set expanded(value: boolean) {
    this._expanded = value;
    if (this.chart) {
      this.chart.resize();
    }
  }

  public get expanded(): boolean {
    return this._expanded;
  }

  @Input() public expandable = false;

  @Input()
  public graphId = 'benchmark-chart';

  @ViewChild('canvasElement', { static: true })
  public canvasElement: ElementRef;

  @Input()
  public selectedPoint: IInferenceExecutionInfo;

  @Output()
  public pointSelectedChange: EventEmitter<IInferenceResult> = new EventEmitter<IInferenceResult>();

  @Output() public toggleExpand = new EventEmitter<void>();

  private chart: Chart;

  public sweetSpotPoint: IInferenceResult;

  public linesPoints: { x: number; y: number; batch: number; stream: number; type: CHART_POINT_TYPE }[] = [];

  public maxLatencyForm: UntypedFormGroup;
  public maxLatencyField: AdvancedConfigField = {
    type: 'input',
    label: `In range 0-1000`,
    name: 'maxLatency',
    value: 0,
    maxNumber: 1000,
    validators: [Validators.min(0), Validators.max(1000), Validators.pattern(/^\d+$/)],
  };
  private _isLatencyChanged = false;

  private pointsOptions: IPointOptionsSet;

  private readonly _unsubscribe$ = new Subject();

  constructor(@Inject(LOCALE_ID) private _localeId, private googleAnalyticsService: GoogleAnalyticsService) {}

  ngOnInit() {
    this.pointsOptions = !this.mode || this.mode === 'a' ? POINTS_OPTION_SETS.A : POINTS_OPTION_SETS.B;
    Chart.pluginService.register(borderLinePlugin);
    this.renderChart(this.inferenceResults);

    this.linesPoints = this.getLinesPoints();

    this.maxLatencyForm = new UntypedFormGroup({
      maxLatency: new UntypedFormControl(this.maxLatencyField.value, this.maxLatencyField.validators),
    });
    this.maxLatencyControl.valueChanges.pipe(takeUntil(this._unsubscribe$)).subscribe((value) => {
      this.setChartLatency(this.chart, this.inferenceResults, value);
      this.setChartPointStyles();
      this.chart.update();
    });

    this._setMaxLatencyThreshold();
  }

  ngOnChanges(changes: SimpleChanges) {
    each(changes, (val, key) => {
      if (val.isFirstChange()) {
        return;
      }
      switch (key) {
        case 'inferenceResults':
        case 'normalizationResults':
          this.setGraphPoints(this.inferenceResults);
          this.setChartLatency(this.chart, this.inferenceResults, this.maxLatencyForm.controls.maxLatency.value);
          this.setChartPointStyles();
          this._setMaxLatencyThreshold();
          return;
        case 'selectedPoint':
          this.setChartPointStyles();
          return;
        default:
          return;
      }
    });

    const onlyProjectChanged = Object.keys(changes).length === 1 && !!changes.project;

    if (this.chart && !onlyProjectChanged) {
      this.chart.update();
    }

    this.linesPoints = this.getLinesPoints();
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  renderChart(inferenceResults: IInferenceResult[]) {
    const bounds = this.getSuggestedBounds(inferenceResults);
    this.chart = new Chart(this.canvasElement.nativeElement, {
      type: 'scatter',
      data: {
        datasets: [
          {
            pointBackgroundColor: map(inferenceResults, () => this.pointsOptions.line.backgroundColor),
            pointStyle: [],
            borderColor: this.pointsOptions.line.backgroundColor,
            borderWidth: 1,
            pointRadius: [],
            data: execInfoToChartPoints(inferenceResults),
            cubicInterpolationMode: 'monotone',
            showLine: true,
            fill: false,
          },
        ],
      },
      options: {
        tooltips: {
          enabled: true,
          mode: 'nearest',
          intersect: false,
          callbacks: {
            label: this.labelCB.bind(this),
            afterLabel: this.afterLabel.bind(this),
          },
          displayColors: false,
          backgroundColor: 'rgba(56, 56, 56, 0.7)',
        },
        borderLine: {},

        scales: {
          xAxes: [
            {
              id: 'x-axis-0',
              type: 'linear',
              position: 'bottom',
              scaleLabel: {
                display: false,
                fontColor: 'black',
                fontSize: 14,
                labelString: 'Latency, ms',
              },
              ticks: {
                beginAtZero: true,
                suggestedMax: bounds.x.max,
                padding: 20,
              },
              gridLines: {
                drawTicks: false,
              },
            },
          ],
          yAxes: [
            {
              id: 'y-axis-0',
              type: 'linear',
              position: 'left',
              scaleLabel: {
                display: false,
                fontColor: 'black',
                fontSize: 14,
                labelString: 'Throughput',
              },
              ticks: {
                suggestedMax: bounds.y.max,
                suggestedMin: bounds.y.min,
                padding: 20,
              },
              gridLines: {
                drawTicks: false,
              },
            },
          ],
        },
        legend: {
          display: false,
        },
        elements: {
          line: {
            tension: 0,
          },
        },
        responsive: true,
        maintainAspectRatio: false,
        onClick: this.onCanvasClick.bind(this),
      } as ChartOptions,
    });

    this.setChartPointStyles();
    this.chart.update();
  }

  setChartLatency(chart, graphData: IInferenceResult[], maxLatency: number): void {
    if (!maxLatency) {
      chart.options.borderLine = {};
      this.sweetSpotPoint = null;
      return;
    }

    chart.options.borderLine = {
      strokeStyle: COMPARISON_CHART_COLOR.SWEET_SPOT_THRESHOLD_LINE,
      fillStyle: 'rgba(191, 191, 191, 0.2)',
      lineDash: [10, 15],
      lineWidth: 3,
      value: maxLatency,
      scaleID: 'x-axis-0',
    };

    this.sweetSpotPoint = this.findSweetSpot(graphData, maxLatency);
    this.googleAnalyticsService.emitEvent(GAActions.SWEETSPOT, Categories.INFERENCE_CHART);
  }

  get maxLatencyControl() {
    return this.maxLatencyForm.get('maxLatency');
  }

  private labelCB(tooltipItem: ChartTooltipItem): string[] {
    const decimalPipe = new DecimalPipe(this._localeId);
    return [`Latency (ms): ${decimalPipe.transform(Number(tooltipItem.xLabel), '1.0-2')}`];
  }

  private afterLabel(tooltipItem: ChartTooltipItem, data: ChartData): string[] {
    const nireqLabel = isVPU(this.project.deviceName) ? 'Parallel Inference Requests' : 'Parallel streams';
    const point = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index] as IBenchmarkChartPoint;
    const decimalPipe = new DecimalPipe(this._localeId);
    return [
      `Throughput (${point.throughputUnit}): ${decimalPipe.transform(Number(tooltipItem.yLabel), '1.0-2')}`,
      `Batch size: ${point.batch}`,
      `${nireqLabel}: ${point.nireq}`,
    ];
  }

  private findSweetSpot(data: IInferenceResult[], maxLatency): IInferenceResult {
    const filteredData = filter<IInferenceResult>(data, (el) => el.latency <= maxLatency);
    return maxBy<IInferenceResult>(filteredData, (o) => o.throughput);
  }

  public onCanvasClick(event?: MouseEvent, activeElements?: { [key: string]: number }[]) {
    if (!this.chart || isEmpty(activeElements)) {
      return;
    }

    const dataPoint = get(
      this.chart,
      `data.datasets[${activeElements[0]._datasetIndex}].data[${activeElements[0]._index}]`
    );
    this.pointSelectedChange.emit(this.inferenceResults.find((i) => i.id === dataPoint.inferenceId));
  }

  private setGraphPoints(points: IInferenceResult[]): void {
    if (!this.chart) {
      return;
    }

    set(this.chart, `data.datasets[0].data`, execInfoToChartPoints(points));

    const bounds = this.getSuggestedBounds(this.normalizationResults || points);
    set(this.chart, `options.scales.xAxes[0].ticks.suggestedMax`, bounds.x.max);
    set(this.chart, `options.scales.yAxes[0].ticks.suggestedMax`, bounds.y.max);
    set(this.chart, `options.scales.yAxes[0].ticks.suggestedMin`, bounds.y.min);
  }

  private getSuggestedBounds(points: IInferenceExecutionInfo[] = []) {
    if (!points.length) {
      return { x: { min: 0, max: 10 }, y: { min: 0, max: 100 } };
    }
    const minLatency = minBy(points, 'latency').latency;
    const maxLatency = maxBy(points, 'latency').latency;
    const minThroughput = minBy(points, 'throughput').throughput;
    const maxThroughput = maxBy(points, 'throughput').throughput;
    const throughputPadding = (maxThroughput - minThroughput) * 0.1;

    return {
      y: { max: maxThroughput + throughputPadding, min: minThroughput - throughputPadding },
      x: { max: maxLatency + minLatency, min: 0 },
    };
  }

  private setPointsToDefaultState() {
    const dataset = this.chart.data.datasets[0];
    const { backgroundColor, pointStyle, pointRadius, type } = this.pointsOptions.line;
    dataset.data.forEach((item, i) => {
      dataset.pointBackgroundColor[i] = backgroundColor;
      dataset.pointStyle[i] = pointStyle;
      dataset.pointRadius[i] = pointRadius;
      (item as IBenchmarkChartPoint).type = type;
    });
  }

  private setChartPointStyles() {
    this.setPointsToDefaultState();

    if (!isNil(this.selectedPoint)) {
      this.setStyleToPoint(this.selectedPoint, this.pointsOptions.selected);
    }

    if (!isNil(this.sweetSpotPoint)) {
      this.setSweetSpotStyle(this.sweetSpotPoint);
    }
  }

  private setStyleToPoint(point: IInferenceExecutionInfo, styleOptions: IPointOptions) {
    const targetDataset = this.chart.config.data.datasets[0];
    const index = findIndex(targetDataset.data as IBenchmarkChartPoint[], { x: point.latency, y: point.throughput });
    if (index === -1) {
      return;
    }

    targetDataset.pointBackgroundColor[index] = styleOptions.backgroundColor;
    targetDataset.pointRadius[index] = styleOptions.pointRadius;
    targetDataset.pointStyle[index] = styleOptions.pointStyle;
    (targetDataset.data[index] as IBenchmarkChartPoint).type = styleOptions.type;
  }

  private setSweetSpotStyle(point: IInferenceExecutionInfo): void {
    if (!this.selectedPoint) {
      return;
    }

    let pointStyle = this.pointsOptions.sweetSpot;

    if (point.batch === this.selectedPoint.batch && point.nireq === this.selectedPoint.nireq) {
      pointStyle = this.pointsOptions.selectedSweetSpot;
    }
    this.setStyleToPoint(point, pointStyle);
  }

  public getLinesPoints(): { x: number; y: number; batch: number; stream: number; type: CHART_POINT_TYPE }[] {
    if (!this.chart) {
      return [];
    }
    const dataset = this.chart.config.data.datasets[0];

    return this.chart.getDatasetMeta(0).data.map((pointElement) => {
      const { x, y } = pointElement._model;
      const { batch, nireq, type } = dataset.data[pointElement._index] as IBenchmarkChartPoint;
      return {
        x,
        y,
        type,
        batch,
        stream: nireq,
      };
    });
  }

  private _setMaxLatencyThreshold(): void {
    if (this._isLatencyChanged) {
      return;
    }

    const maxLatency = Math.ceil(maxBy(this.inferenceResults || [], 'latency')?.latency || 0);

    if (maxLatency !== 0) {
      this.maxLatencyControl.setValue(maxLatency);
      this._isLatencyChanged = true;
    }
  }
}
