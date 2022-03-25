import { createRectPath, IRectRadius } from './shapes';
import { BBox } from '../image-renderer';

interface IRectPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface ILabelOptions {
  padding: IRectPadding;
  radius: IRectRadius;
  font: string;
}

function drawLabel(ctx: CanvasRenderingContext2D, x: number, y: number, label: string, options: ILabelOptions): void {
  const { font, padding, radius } = options;
  ctx.font = font;
  const metrics = ctx.measureText(label);
  const height = Math.round(metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent);
  const width = Math.round(metrics.width);

  const textBgPath = createRectPath(
    x,
    y - height,
    width + (padding.left + padding.right),
    height + (padding.top + padding.bottom),
    radius
  );

  ctx.fill(textBgPath);
  ctx.fillStyle = 'white';
  ctx.fillText(label, x + padding.left, y + padding.top);
}

export interface IBoxOptions {
  color: string;
  lineWidth: number;
  label: ILabelOptions;
}

export function drawBox(ctx: CanvasRenderingContext2D, bbox: BBox, label: string, options: IBoxOptions): void {
  const { lineWidth, color, label: labelOptions } = options;
  const [xmin, ymin, xmax, ymax] = bbox;

  // draw main box
  const path = createRectPath(xmin, ymin, xmax - xmin, ymax - ymin);
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = color;
  ctx.stroke(path);

  // draw label box
  ctx.fillStyle = color;
  drawLabel(
    ctx,
    xmin - ctx.lineWidth / 2,
    ymin -
      ctx.lineWidth / 2 -
      (labelOptions.padding.top + labelOptions.padding.bottom) +
      labelOptions.radius.bottomLeft,
    label,
    labelOptions
  );
}
