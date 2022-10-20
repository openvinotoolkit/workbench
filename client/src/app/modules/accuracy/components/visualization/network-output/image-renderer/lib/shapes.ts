export interface IRectRadius {
  topLeft: number;
  topRight: number;
  bottomRight: number;
  bottomLeft: number;
}

export function createRectPath(x: number, y: number, width: number, height: number, radius?: IRectRadius): Path2D {
  const path = new Path2D();
  if (!radius) {
    // performance improvement
    path.rect(x, y, width, height);
    return path;
  }

  path.moveTo(x, y + radius.topLeft);
  path.arcTo(x, y + height, x + radius.bottomLeft, y + height, radius.bottomLeft);
  path.arcTo(x + width, y + height, x + width, y + height - radius.bottomRight, radius.bottomRight);
  path.arcTo(x + width, y, x + width - radius.topRight, y, radius.topRight);
  path.arcTo(x, y, x, y + radius.topLeft, radius.topLeft);
  return path;
}
