import { fromEvent } from 'rxjs';
import { take } from 'rxjs/operators';

import { getScalingRatio } from './painting-canvas/canvas-helpers';

// [x_min, y_min, x_max, y_max]
export type BBox = [number, number, number, number];

const createBackgroundContext = async (src: string): Promise<CanvasRenderingContext2D> => {
  const context = document.createElement('canvas').getContext('2d');

  const image = new Image();
  image.src = src;
  await fromEvent(image, 'load').pipe(take(1)).toPromise();

  context.canvas.width = image.width;
  context.canvas.height = image.height;
  context.drawImage(image, 0, 0);
  context.save();

  return context;
};

export class ImageRenderer {
  private _context: CanvasRenderingContext2D = null;
  private _src: string = null;

  private _backgroundContext: CanvasRenderingContext2D = null;

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
    this._backgroundContext = await createBackgroundContext(this._src);
    this._context.canvas.width = this._backgroundContext.canvas.width;
    this._context.canvas.height = this._backgroundContext.canvas.height;
  }

  render(): void {
    // rendering from background context faster than image recreation
    this._context.clearRect(0, 0, this._context.canvas.width, this._context.canvas.height);
    this._context.drawImage(this._backgroundContext.canvas, 0, 0);
  }

  drawBox(bbox: BBox, color: string = 'red') {
    if (!bbox || !bbox.length) {
      return;
    }

    // for big images boxes a barely visible due to thin line width
    // scale line width to viewport size
    const { xRatio, yRatio } = getScalingRatio(this._context);
    const lineRatio = Math.max(xRatio, yRatio);
    const lineWidth = lineRatio < 0 ? 3 : Math.round(lineRatio * 3);

    const [xmin, ymin, xmax, ymax] = bbox;

    const path = new Path2D();
    path.rect(xmin, ymin, xmax - xmin, ymax - ymin);
    this._context.lineWidth = lineWidth;
    this._context.strokeStyle = color;
    this._context.stroke(path);
  }

  /**
   * Draw polygon areas with intersections
   * @param polygons
   * @param color
   */
  drawPolygons(polygons: number[][], color: string = 'red'): void {
    if (!polygons?.length) {
      return;
    }

    // create a dedicated canvas
    const polygonsCanvas = document.createElement('canvas');
    polygonsCanvas.width = this._context.canvas.width;
    polygonsCanvas.height = this._context.canvas.height;
    const polygonContext = polygonsCanvas.getContext('2d');

    // handle intersections with 'xor' composite operation
    // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation
    // cannot apply colors here because of opacity
    polygonContext.globalCompositeOperation = 'xor';

    for (const polygon of polygons) {
      const path = new Path2D();
      for (let i = 0; i < polygon.length; i += 2) {
        path.lineTo(polygon[i], polygon[i + 1]);
      }
      path.closePath();
      polygonContext.fill(path);
    }

    // apply colors for composed polygon
    polygonContext.globalCompositeOperation = 'source-in';

    const coloredForeground = new Path2D();
    coloredForeground.rect(0, 0, polygonContext.canvas.width, polygonContext.canvas.height);
    polygonContext.fillStyle = color;
    polygonContext.fill(coloredForeground);

    // draw composed colored polygon on a main canvas
    this._context.drawImage(polygonContext.canvas, 0, 0);
  }

  destroy() {
    URL.revokeObjectURL(this._src);
    this._src = null;
    this._context = null;
    this._backgroundContext = null;
  }
}
