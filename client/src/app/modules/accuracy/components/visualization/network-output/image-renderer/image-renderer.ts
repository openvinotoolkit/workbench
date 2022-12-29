import { fromEvent } from 'rxjs';
import { take } from 'rxjs/operators';

import { getScalingRatio } from './lib/coordinates-helper';
import { drawBox, IBoxOptions } from './lib/box';
import { createContext } from './lib';
import { drawPolygons, IPolygonOptions } from './lib/polygon';

// [x_min, y_min, x_max, y_max]
export type BBox = [number, number, number, number];

const createImageBackgroundContext = async (src: string): Promise<CanvasRenderingContext2D> => {
  const image = new Image();
  image.src = src;
  await fromEvent(image, 'load').pipe(take(1)).toPromise();

  const context = createContext(image.width, image.height);
  context.drawImage(image, 0, 0);
  context.save();

  return context;
};

export class ImageRenderer {
  private _context: CanvasRenderingContext2D = null;
  private _src: string = null;

  private _backgroundContext: CanvasRenderingContext2D = null;

  private _scaleToImageSize: (value: number) => number;

  constructor(canvasEl: HTMLCanvasElement, input: File | string) {
    this._context = canvasEl.getContext('2d');

    if (typeof input === 'string') {
      this._src = `data:img/png;base64,${input}`;
      return;
    }

    this._src = URL.createObjectURL(input);
  }

  get initialized(): boolean {
    return !!this._backgroundContext;
  }

  async initialize(): Promise<void> {
    // cache original image in background context
    this._backgroundContext = await createImageBackgroundContext(this._src);
    this._context.canvas.width = this._backgroundContext.canvas.width;
    this._context.canvas.height = this._backgroundContext.canvas.height;

    const { xRatio, yRatio } = getScalingRatio(this._context);
    const ratio = Math.max(xRatio, yRatio);
    this._scaleToImageSize = (value: number) => (ratio < 0 ? value : Math.round(ratio * value));
  }

  render(): void {
    // rendering from background context faster than image recreation
    this._context.clearRect(0, 0, this._context.canvas.width, this._context.canvas.height);
    this._context.drawImage(this._backgroundContext.canvas, 0, 0);
  }

  drawBox(bbox: BBox, color: string, label: string): void {
    if (!bbox || !bbox.length) {
      return;
    }

    const options: IBoxOptions = {
      color,
      lineWidth: this._scaleToImageSize(6),
      label: {
        padding: {
          top: this._scaleToImageSize(8),
          right: this._scaleToImageSize(15),
          bottom: this._scaleToImageSize(8),
          left: this._scaleToImageSize(15),
        },
        radius: {
          topLeft: this._scaleToImageSize(5),
          topRight: this._scaleToImageSize(5),
          bottomRight: this._scaleToImageSize(5),
          bottomLeft: this._scaleToImageSize(5),
        },
        font: `${this._scaleToImageSize(20)}px Roboto`,
      },
    };

    drawBox(this._context, bbox, label, options);
  }

  /**
   * Draw polygon areas with intersections
   *
   * @param polygons
   * @param color
   */
  drawPolygons(polygons: number[][], color: string): void {
    if (!polygons?.length) {
      return;
    }

    const polygonOptions: IPolygonOptions = {
      color,
      innerBorderWidth: this._scaleToImageSize(3),
    };

    drawPolygons(this._context, polygons, polygonOptions);
  }

  destroy() {
    URL.revokeObjectURL(this._src);
    this._src = null;
    this._context = null;
    this._backgroundContext = null;
  }
}
