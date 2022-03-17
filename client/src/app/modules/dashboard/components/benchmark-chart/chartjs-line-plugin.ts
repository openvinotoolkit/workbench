import { Chart, ChartArea, PluginServiceRegistrationOptions } from 'chart.js';
import { isEmpty } from 'lodash';

export interface BorderLineOptions {
  strokeStyle: string;
  fillStyle: string;
  lineDash: number[];
  lineWidth: number;
  value: number;
  scaleID: string;
}

/**
 * @name BorderLine
 * BorderLine is responsible for affecting changes on the canvas.
 * It draws threshold line by given x axis value and blurs the rest of graph
 * @param ctx context from chart.ctx
 * @param options options from chart.config.option.lineHeightAnnotation
 */
export class BorderLine {
  public ctx: CanvasRenderingContext2D;
  public options: BorderLineOptions;

  constructor(ctx, options) {
    this.ctx = ctx;
    this.options = options;
  }

  public drawBorder(chartArea: ChartArea, scale) {
    const ctx = this.ctx;
    const options = this.options;
    const pixelXValue = scale.getPixelForValue(options.value);
    if (pixelXValue < chartArea.left || pixelXValue > chartArea.right) {
      return;
    }
    ctx.save();
    if (options.lineDash) {
      ctx.setLineDash(options.lineDash);
    }
    if (options.lineWidth) {
      ctx.lineWidth = options.lineWidth;
    }
    ctx.beginPath();
    ctx.moveTo(pixelXValue, chartArea.bottom);
    ctx.lineTo(pixelXValue, chartArea.top);
    ctx.fillStyle = options.fillStyle;
    ctx.strokeStyle = options.strokeStyle;
    ctx.fillRect(pixelXValue, chartArea.top, chartArea.right - pixelXValue, chartArea.bottom - chartArea.top);
    ctx.stroke();
    ctx.restore();
  }
}

interface IChartWithBorderLinePlugin extends Chart {
  scales: { [key: string]: number };
}

export const borderLinePlugin = {
  beforeDraw: (chartInstance: IChartWithBorderLinePlugin, easingValue) => {
    const { borderLine = {} } = chartInstance.config.options as { borderLine: { scaleID?: string } };
    if (!isEmpty(borderLine) && chartInstance.config.type === 'scatter') {
      const { ctx } = chartInstance;
      const { chartArea: area } = chartInstance;
      const scale = chartInstance.scales[borderLine.scaleID];
      const borderHandler = new BorderLine(ctx, borderLine);
      borderHandler.drawBorder(area, scale);
    }
  },
} as PluginServiceRegistrationOptions;
