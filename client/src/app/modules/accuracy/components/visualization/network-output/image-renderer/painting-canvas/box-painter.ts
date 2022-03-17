import { toImageCoordinates } from './canvas-helpers';

interface IBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

const BLACK_COLOR = '#000000';
const WHITE_COLOR = '#ffffff';

export class BoxPainter {
  private readonly _context: CanvasRenderingContext2D = null;

  private _boxes: IBox[] = [];
  private _currentBox: IBox;

  constructor(canvasEl: HTMLCanvasElement) {
    this._context = canvasEl.getContext('2d');

    this._mousedown = this._mousedown.bind(this);
    this._mousemove = this._mousemove.bind(this);
    this._mouseup = this._mouseup.bind(this);
    this._mouseout = this._mouseout.bind(this);
  }

  start() {
    this._context.canvas.addEventListener('mousedown', this._mousedown);
    this._context.canvas.addEventListener('mouseup', this._mouseup);
    this._context.canvas.addEventListener('mousemove', this._mousemove);
    this._context.canvas.addEventListener('mouseout', this._mouseout);
  }

  stop() {
    this._context.canvas.removeEventListener('mousedown', this._mousedown);
    this._context.canvas.removeEventListener('mouseup', this._mouseup);
    this._context.canvas.removeEventListener('mousemove', this._mousemove);
    this._context.canvas.removeEventListener('mouseout', this._mouseout);
    this._context.canvas.style.cursor = 'auto';
  }

  private _mousedown(e: MouseEvent) {
    const coords = toImageCoordinates(this._context, e.clientX, e.clientY);
    if (!coords) {
      return;
    }

    // in case of mouseout with left button pressed
    if (this._currentBox) {
      return;
    }

    this._currentBox = { x: coords.x, y: coords.y, w: 0, h: 0 };
  }

  private _mousemove(e: MouseEvent) {
    const coords = toImageCoordinates(this._context, e.clientX, e.clientY);
    if (!coords) {
      this._context.canvas.style.cursor = 'auto';
      return;
    }

    this._context.canvas.style.cursor = 'crosshair';

    if (!this._currentBox) {
      return;
    }

    this._context.clearRect(0, 0, this._context.canvas.width, this._context.canvas.height);
    this._boxes.forEach((box) => this._context.fillRect(box.x, box.y, box.w, box.h));

    this._context.fillStyle = WHITE_COLOR;
    this._currentBox.w = coords.x - this._currentBox.x;
    this._currentBox.h = coords.y - this._currentBox.y;
    this._context.fillRect(this._currentBox.x, this._currentBox.y, this._currentBox.w, this._currentBox.h);
  }

  private _mouseup(e: MouseEvent) {
    if (!this._currentBox) {
      return;
    }

    const coords = toImageCoordinates(this._context, e.clientX, e.clientY);
    if (!coords) {
      return;
    }

    this._currentBox.w = coords.x - this._currentBox.x;
    this._currentBox.h = coords.y - this._currentBox.y;

    // skip random clicks (side is less than 5)
    if (Math.abs(this._currentBox.w) > 5 || Math.abs(this._currentBox.h) > 5) {
      this._boxes.push(this._currentBox);
    }

    this._currentBox = null;

    this._context.clearRect(0, 0, this._context.canvas.width, this._context.canvas.height);
    this._boxes.forEach((box) => this._context.fillRect(box.x, box.y, box.w, box.h));
  }

  private _mouseout(_: MouseEvent) {
    this._context.canvas.style.cursor = 'auto';
  }

  clear() {
    this._context.canvas.style.cursor = 'auto';
    this._context.clearRect(0, 0, this._context.canvas.width, this._context.canvas.height);
    this._boxes = [];
    this._currentBox = null;
  }

  toBlob(): Promise<Blob> {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = this._context.canvas.width;
    exportCanvas.height = this._context.canvas.height;
    const exportContext = exportCanvas.getContext('2d');
    exportContext.fillStyle = BLACK_COLOR;
    exportContext.fillRect(0, 0, exportContext.canvas.width, exportContext.canvas.height);
    exportContext.fillStyle = WHITE_COLOR;
    this._boxes.forEach((box) => exportContext.fillRect(box.x, box.y, box.w, box.h));
    return new Promise((resolve) => exportContext.canvas.toBlob(resolve, 'image/png'));
  }
}
