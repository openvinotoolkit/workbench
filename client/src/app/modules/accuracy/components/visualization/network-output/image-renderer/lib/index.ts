export const createContext = (width: number, height: number): CanvasRenderingContext2D => {
  const context = document.createElement('canvas').getContext('2d');
  context.canvas.width = width;
  context.canvas.height = height;
  return context;
};
