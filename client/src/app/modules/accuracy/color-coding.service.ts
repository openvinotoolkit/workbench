import { Injectable } from '@angular/core';

import { uniq } from 'lodash';

import { IInferencePrediction } from '@store/inference-test-image-store/inference-test-image-models';

import {
  IColoredInferencePrediction,
  IInferencePredictionColors,
} from './components/visualization/network-output/network-output.component';

const ACCURACY_COLORS = [
  '#E04300',
  '#FFA927',
  '#FFC700',
  '#FAFF00',
  '#00EE2B',
  '#51FF77',
  '#B2FF51',
  '#00FFA3',
  '#30D4A8',
  '#B4FFFF',
  '#0FF5F5',
  '#00A3FF',
  '#0047FF',
  '#A772FF',
  '#DE12FF',
  '#FF9FEC',
  '#E700B4',
  '#FF7D7D',
  '#FF5151',
  '#FF0000',
];

@Injectable()
export class ColorCodingService {
  readonly PREDICTION_COLOR = ACCURACY_COLORS[0];
  readonly REFERENCE_COLOR = ACCURACY_COLORS[1];

  // adds alpha channel in hex format
  private readonly _getMaskColor = (color: string): string => `${color}50`;

  private readonly _getActiveBadgeStyles = (color: string): { [key: string]: string } => ({
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
