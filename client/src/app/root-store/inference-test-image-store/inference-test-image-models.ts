export interface ITestImage {
  id: number;
  predictions: IInferencePrediction[];
  refPredictions?: IInferencePrediction[];
}

export interface IInferencePrediction {
  score?: number;
  category_id?: number;
  // [x_min, y_min, x_max, y_max]
  bbox?: [number, number, number, number];
  segmentation?: number[][];
  image?: string;
  explanation_mask?: string;
}

export interface ILabelSet {
  id: number;
  name: string;
  labels: { [label: string]: string };
}
