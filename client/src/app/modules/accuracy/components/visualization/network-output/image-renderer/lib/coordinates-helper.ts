// helper functions for mouse coordinate transformation

/**
 * Transforms coordinates from client to context boxes
 * From
 *        | context width box |
 * To
 * | html scaled 100% client width box |
 *
 * Also handles object-fit css property
 *
 * @param context
 * @param imageX
 * @param imageY
 */
export function toCanvasCoordinates(
  context: CanvasRenderingContext2D,
  imageX: number,
  imageY: number
): { x: number; y: number } {
  const size = fitSize(
    context.canvas.clientWidth,
    context.canvas.clientHeight,
    context.canvas.width,
    context.canvas.height
  );

  const xRatio = context.canvas.width / size.width;
  const yRatio = context.canvas.height / size.height;

  const x = imageX / xRatio + size.x;
  const y = imageY / yRatio + size.y;
  return { x, y };
}

export function getScalingRatio(context: CanvasRenderingContext2D): { xRatio: number; yRatio: number } {
  const size = fitSize(
    context.canvas.clientWidth,
    context.canvas.clientHeight,
    context.canvas.width,
    context.canvas.height
  );

  const xRatio = context.canvas.width / size.width;
  const yRatio = context.canvas.height / size.height;

  return { xRatio, yRatio };
}

/**
 * Transforms coordinates from client to context boxes
 * From
 * | html scaled 100% client width box |
 * To
 *      | context width box |
 *
 * Also handles object-fit css property
 *
 * @param context
 * @param clientX
 * @param clientY
 */
export function toImageCoordinates(
  context: CanvasRenderingContext2D,
  clientX: number,
  clientY: number
): { x: number; y: number } | null {
  const { left, top } = context.canvas.getBoundingClientRect();
  const size = fitSize(
    context.canvas.clientWidth,
    context.canvas.clientHeight,
    context.canvas.width,
    context.canvas.height
  );

  const xRatio = context.canvas.width / size.width;
  const yRatio = context.canvas.height / size.height;

  const x = (clientX - left - size.x) * xRatio;
  const y = (clientY - top - size.y) * yRatio;

  if (x < 0 || x > context.canvas.width || y < 0 || y > context.canvas.height) {
    return null;
  }

  return { x, y };
}

function fitSize(
  containerWidth,
  containerHeight,
  width,
  height,
  value: 'contain' | 'cover' = 'contain'
): { width: number; height: number; x: number; y: number } {
  const cRatio = containerWidth / containerHeight;
  const oRatio = width / height;
  let targetWidth = 0;
  let targetHeight = 0;

  if (value === 'contain' ? oRatio > cRatio : oRatio < cRatio) {
    targetWidth = containerWidth;
    targetHeight = targetWidth / oRatio;
  } else {
    targetHeight = containerHeight;
    targetWidth = targetHeight * oRatio;
  }

  return {
    width: targetWidth,
    height: targetHeight,
    x: (containerWidth - targetWidth) / 2,
    y: (containerHeight - targetHeight) / 2,
  };
}
