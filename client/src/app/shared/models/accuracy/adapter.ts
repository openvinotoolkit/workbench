export type IAdapter = IMaskRCNNNonTFAdapter | IMaskRCNNTFAdapter | IYoloV3V4Adapter;

export interface IMaskRCNNNonTFAdapter {
  image_info_input: string;
  outputs: {
    raw_masks_out: string;
    boxes_out: string;
    classes_out: string;
    scores_out: string;
  };
}

export interface IMaskRCNNTFAdapter {
  image_info_input: string;
  outputs: {
    raw_masks_out: string;
    detection_out: string;
  };
}

export interface IYoloV3V4Adapter {
  classes: number;
}
