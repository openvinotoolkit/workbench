import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { maxBy } from 'lodash';

import { ILabelSet } from '@store/inference-test-image-store/inference-test-image-models';

import { IColoredInferencePrediction, VisualizationMode } from '../../network-output.component';
import { getPredictionsTitles, IInferenceResultChangeEvent } from '../inference-results.component';

@Component({
  selector: 'wb-classification-results',
  templateUrl: './classification-results.component.html',
  styleUrls: ['./classification-results.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassificationResultsComponent {
  @Input() labelSet: ILabelSet = null;

  private _predictions: IColoredInferencePrediction[] = [];
  @Input() set predictions(value: IColoredInferencePrediction[]) {
    this._predictions = value;
    this.rationBarNormalization = this.getRationBarNormalization();
  }

  get predictions(): IColoredInferencePrediction[] {
    return this._predictions;
  }

  private _refPredictions: IColoredInferencePrediction[] = [];
  @Input() set refPredictions(value: IColoredInferencePrediction[]) {
    this._refPredictions = value;
    this.rationBarNormalization = this.getRationBarNormalization();
  }

  get refPredictions(): IColoredInferencePrediction[] {
    return this._refPredictions;
  }

  @Input() accuracyReportMode = false;

  private _mode: VisualizationMode = null;
  @Input() set mode(value: VisualizationMode) {
    this._mode = value;
    const titles = getPredictionsTitles(value);
    this.modelPredictionsTitle = titles.model;
    this.referencePredictionsTitle = titles.reference;
  }

  get mode(): VisualizationMode {
    return this._mode;
  }

  modelPredictionsTitle: string = null;
  referencePredictionsTitle: string = null;

  rationBarNormalization: number = null;

  selectedPrediction: IColoredInferencePrediction = null;

  readonly originalModelBarHue = 130;
  readonly int8ModelBarHue = 229;

  @Output() selectedPredictionsChange = new EventEmitter<IInferenceResultChangeEvent>();

  onPredictionClick(prediction: IColoredInferencePrediction): void {
    if (this._mode !== 'explain' || this.selectedPrediction === prediction) {
      return;
    }

    this.selectedPrediction = prediction;
    this._emitChange();
  }

  private _emitChange(): void {
    this.selectedPredictionsChange.emit({ renderer1: [this.selectedPrediction] });
  }

  getRefPredictionScore(prediction: IColoredInferencePrediction): number {
    const referenceScore = this._refPredictions.find(
      (refPrediction) => refPrediction?.category_id === prediction.category_id
    );
    return referenceScore?.score || 0;
  }

  getRationBarNormalization(): number {
    return maxBy([...this._predictions, ...(this._refPredictions || [])], 'score').score * 100;
  }

  getLegendColor(hue: number): string {
    return `hsl(${hue}, 50%, 20%)`;
  }
}
