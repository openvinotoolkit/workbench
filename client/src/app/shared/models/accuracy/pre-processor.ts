export enum PreProcessorType {
  AUTO_RESIZE = 'auto_resize',
  FREE_FORM_MASK = 'free_form_mask',
  RECT_MASK = 'rect_mask',
}

export type IPreProcessor = IAutoResizePreProcessor | IFreeFormMaskPreProcessor | IRectMaskPreProcessor;

export interface IAutoResizePreProcessor {
  type: PreProcessorType.AUTO_RESIZE;
}

export interface IFreeFormMaskPreProcessor {
  type: PreProcessorType.FREE_FORM_MASK;
  parts: number;
  max_brush_width: number;
  max_length: number;
  max_vertex: number;
  inverse_mask: boolean;
}

export interface IRectMaskPreProcessor {
  type: PreProcessorType.RECT_MASK;
  dst_width: number;
  dst_height: number;
  inverse_mask: boolean;
}
