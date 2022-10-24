import { createContext } from './index';

export interface IPolygonOptions {
  color: string;
  innerBorderWidth: number;
}

export function drawPolygons(ctx: CanvasRenderingContext2D, polygons: number[][], options: IPolygonOptions): void {
  // create a dedicated canvas
  const polygonContext = createContext(ctx.canvas.width, ctx.canvas.height);

  // handle intersections with 'xor' composite operation
  // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation
  // cannot apply colors here because of opacity
  polygonContext.globalCompositeOperation = 'xor';

  const polygonsPath = new Path2D();
  for (const polygon of polygons) {
    const path = new Path2D();
    for (let i = 0; i < polygon.length; i += 2) {
      path.lineTo(polygon[i], polygon[i + 1]);
    }
    path.closePath();
    polygonsPath.addPath(path);

    polygonContext.globalCompositeOperation = 'xor';
    polygonContext.fill(path);
  }

  const bordersContext = createBorderContext(ctx, polygonsPath, polygonContext, options);

  const coloredForeground = new Path2D();
  coloredForeground.rect(0, 0, polygonContext.canvas.width, polygonContext.canvas.height);

  // apply colors for composed polygon
  polygonContext.globalCompositeOperation = 'source-in';
  polygonContext.fillStyle = options.color;
  polygonContext.fill(coloredForeground);

  // draw borders
  polygonContext.globalCompositeOperation = 'source-over';
  polygonContext.drawImage(bordersContext.canvas, 0, 0);

  // draw composed colored polygon on a main canvas
  ctx.drawImage(polygonContext.canvas, 0, 0);
}

function createBorderContext(
  ctx: CanvasRenderingContext2D,
  polygonPath: Path2D,
  polygonContext: CanvasRenderingContext2D,
  options: IPolygonOptions
): CanvasRenderingContext2D {
  // create a dedicated canvas
  const context = createContext(ctx.canvas.width, ctx.canvas.height);

  // stroke polygon paths with double width
  context.lineWidth = options.innerBorderWidth * 2;
  context.strokeStyle = options.color.slice(0, 7);
  context.globalCompositeOperation = 'source-over';
  context.stroke(polygonPath);

  // remove half of the outer path width
  context.globalCompositeOperation = 'destination-in';
  context.drawImage(polygonContext.canvas, 0, 0);

  // draw 1 pixel outer width
  context.lineWidth = 1;
  context.globalCompositeOperation = 'source-over';
  context.stroke(polygonPath);

  // result is a border drawing with inner width of scaledLineWidth and 1px outer width
  return context;
}
