import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  Input,
  LOCALE_ID,
  OnChanges,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';

import { Chart } from 'chart.js';
import { each, isEmpty } from 'lodash';

import { IInferenceResult } from '@store/inference-history-store/inference-history.model';
import { THROUGHPUT_UNIT } from '@store/model-store/model.model';

import { isVPU } from '@shared/models/device';

import { COMPARISON_CHART_COLOR } from '../../constants';

@Component({
  selector: 'wb-bar-chart',
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.scss'],
})
export class BarChartComponent implements AfterViewInit, OnChanges {
  @Input()
  public data: IInferenceResult[] = [];

  @Input()
  public chartLabels: string[] = [];

  @Input()
  public deviceName: string;

  @Input()
  public set throughputUnit(value: THROUGHPUT_UNIT) {
    this.LABEL_MAP.throughput = `Throughput, ${value}`;
  }

  @Input()
  public type: 'throughput' | 'latency' = 'throughput';

  @Input()
  public barColors: COMPARISON_CHART_COLOR[] = [
    COMPARISON_CHART_COLOR.FIRST_SELECTED_POINT,
    COMPARISON_CHART_COLOR.SECOND_SELECTED_POINT,
  ];

  @ViewChild('canvasElement', { static: true })
  canvasElement: ElementRef;

  @ViewChild('barChartTooltip', { static: true })
  barChartTooltip: ElementRef;

  private legend: HTMLElement;
  private tooltip: HTMLElement;
  private chart: Chart;

  private LABEL_MAP = {
    latency: 'Latency, ms',
    throughput: 'Throughput',
  };

  constructor(@Inject(LOCALE_ID) private _localeId) {}

  ngAfterViewInit() {
    this.legend = document.getElementById('js-legend');
    this.tooltip = document.getElementById('js-tooltip');

    this.chart = this.createChart(this.LABEL_MAP[this.type]);

    // TODO refactor component to be more presentational and simple
    if (this.data.length > 1) {
      this.updateChart(this.chart, this.data);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    each(changes, (val, key) => {
      if (val.isFirstChange()) {
        return;
      }
      switch (key) {
        case 'type':
        case 'data':
        case 'chartLabels':
        case 'throughputUnit':
          this.updateChart(this.chart, this.data);
          return;
        default:
          return;
      }
    });
  }

  private createChart(label: string) {
    return new Chart(this.canvasElement.nativeElement, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [
          {
            label,
            data: [],
            backgroundColor: this.barColors,
            borderColor: this.barColors,
            borderWidth: 1,
            maxBarThickness: 120,
            minBarLength: 10,
            barPercentage: 0.3,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        responsive: true,
        tooltips: {
          enabled: false,
          custom: this.customTooltip.bind(this),
        },
        hover: {
          mode: 'nearest',
          intersect: true,
        },
        legend: {
          display: false,
        },
        scales: {
          yAxes: [
            {
              ticks: {
                beginAtZero: true,
              },
              scaleLabel: {
                display: true,
                fontColor: 'black',
                fontSize: 14,
                labelString: label,
              },
            },
          ],
        },
      },
    });
  }

  private getLabelsForData(): string[] {
    if (isEmpty(this.chartLabels)) {
      return [];
    }
    const [firstLabel, secondLabel] = this.chartLabels;
    if (firstLabel && !secondLabel) {
      return [firstLabel];
    }
    return ['', ''];
  }

  public updateChart(chart, data: IInferenceResult[]) {
    chart.data.labels = data.map(() => '');

    chart.data.datasets[0].data = data.map((el) => (this.type === 'latency' ? el.latency : el.throughput));
    chart.data.datasets[0].label = this.LABEL_MAP[this.type];
    chart.options.scales.yAxes[0].scaleLabel.labelString = this.LABEL_MAP[this.type];

    chart.update();
  }

  private customTooltip(tooltip) {
    // Tooltip Element
    const tooltipEl = this.barChartTooltip.nativeElement;

    if (Number(tooltip.opacity) === 0) {
      tooltipEl.style.opacity = '0';
      return;
    }

    // Set caret Position
    tooltipEl.classList.remove('above', 'below', 'no-transform');
    if (tooltip.yAlign) {
      tooltipEl.classList.add(tooltip.yAlign);
    } else {
      tooltipEl.classList.add('no-transform');
    }

    // Set Text
    if (tooltip.body) {
      const titleLines = tooltip.title || [];
      const labels = this.getLabelsForData();

      const currentInferenceExecutionInfo = this.data[tooltip.dataPoints[0].index];
      const { throughput, latency, nireq, batch, totalExecutionTime, throughputUnit } = currentInferenceExecutionInfo;
      const divRoot = tooltipEl.querySelector('div');
      const nireqLabel = isVPU(this.deviceName) ? 'Parallel Inference Requests' : 'Parallel streams';

      const tooltipTitleElement = titleLines
        .map((title) => `<div><b>${title.split(',').join(' • ')}</b></div>`)
        .join('');

      const decimalPipe = new DecimalPipe(this._localeId);

      divRoot.innerHTML = `\
        ${isEmpty(labels) ? '' : tooltipTitleElement}
        <div class="tooltip-details-item">
        <span>${throughputUnit}:&nbsp;</span><span data-test-id="bar-chart-fps">${decimalPipe.transform(
        throughput,
        '1.0-2'
      )}</span>
        </div>
        <div class="tooltip-details-item">
        <span>Latency:&nbsp;</span><span data-test-id="bar-chart-latency">${decimalPipe.transform(
          latency,
          '1.0-2'
        )}, ms</span>
        </div>
        <div class="tooltip-details-item"> <span>Total execution time:&nbsp;</span>
        <span data-test-id="bar-chart-execution-time">${totalExecutionTime}, ms</span></div>
        <div class="tooltip-details-item"><span>${nireqLabel}:&nbsp;</span><span data-test-id="bar-chart-nireq">${nireq}</span></div>
        <div class="tooltip-details-item"><span>Batch size:&nbsp;</span><span data-test-id="bar-chart-batches">${batch}</span></div>`;
    }

    tooltip.xAlign = 'center';
    tooltip.yAlign = 'top';
    tooltipEl.classList.remove('center', 'above', 'below', 'no-transform');
    tooltipEl.classList.add('no-transform');

    // Display, position, and set styles for font
    tooltipEl.style.opacity = '1';
    tooltipEl.style.left = tooltip.caretX + 'px';
    tooltipEl.style.top = tooltip.caretY + 'px';
    tooltipEl.style.padding = '10px';
  }
}
