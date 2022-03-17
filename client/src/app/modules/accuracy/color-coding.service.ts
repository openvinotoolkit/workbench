import { Injectable } from '@angular/core';

import { uniq } from 'lodash';

import { IInferencePrediction } from '@store/inference-test-image-store/inference-test-image-models';

import {
  IColoredInferencePrediction,
  IInferencePredictionColors,
} from './components/visualization/network-output/network-output.component';

const ACCURACY_COLORS = [
  '#1738C6',
  '#0A5818',
  '#620434',
  '#260058',
  '#067C72',
  '#AD6600',
  '#BA665B',
  '#3500CC',
  '#D22176',
  '#00A3B9',
  '#608315',
  '#840707',
  '#2F6AAE',
  '#8F00A7',
  '#B18A00',
];

@Injectable()
export class ColorCodingService {
  readonly PREDICTION_COLOR = '#1738C6';
  readonly REFERENCE_COLOR = '#0A5818';

  // adds alpha channel in hex format
  private readonly _getMaskColor = (color: string): string => `${color}50`;

  private readonly _getActiveBadgeStyles = (color: string): { [key: string]: string } => ({
    color,
    // adds alpha channel in hex format
    'background-color': `${color}14`,
    borderColor: color,
  });

  private readonly _getPredictionColors = (primary: string): IInferencePredictionColors => ({
    primary,
    mask: this._getMaskColor(primary),
    activeStyles: this._getActiveBadgeStyles(primary),
  });

  private _generateColorMap(labels: number[]): { [label: number]: string } {
    const colorGen = () => {
      let i = 0;
      return () => {
        if (i >= ACCURACY_COLORS.length) {
          i = 0;
        }
        return ACCURACY_COLORS[i++];
      };
    };
    const nextColor = colorGen();

    return uniq(labels).reduce((colorMap, label) => {
      colorMap[label] = nextColor();
      return colorMap;
    }, {});
  }

  toColoredPredictions(
    predictions: IInferencePrediction[],
    referencePredictions?: IInferencePrediction[]
  ): { predictions: IColoredInferencePrediction[]; refPredictions: IColoredInferencePrediction[] } {
    const colorMap = this._generateColorMap(
      [...predictions, ...(referencePredictions || [])].map((v) => v.category_id)
    );

    return {
      predictions: predictions.map((prediction) => ({
        ...prediction,
        colors: this._getPredictionColors(
          referencePredictions ? this.PREDICTION_COLOR : colorMap[prediction.category_id]
        ),
      })),
      refPredictions: referencePredictions?.map((prediction) => ({
        ...prediction,
        colors: this._getPredictionColors(this.REFERENCE_COLOR),
      })),
    };
  }
}
