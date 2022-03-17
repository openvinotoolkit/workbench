import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { MessagesService } from '@core/services/common/messages.service';

import { ModelTaskTypes } from '@store/model-store/model.model';
import { ILabelSet } from '@store/inference-test-image-store/inference-test-image-models';

import { IColoredInferencePrediction, VisualizationMode } from '../network-output.component';
import { SUPPORTED_TASK_TYPE } from '../../network-output-visualizer/network-output-visualizer.component';

export function getPredictionsTitles(mode: VisualizationMode): { model: string; reference: string } {
  const result = { model: null, reference: null };
  if (mode === 'parent_model_predictions') {
    result.model = 'Optimized Model Predictions';
    result.reference = 'Parent Model Predictions';
  } else if (mode === 'dataset_annotations') {
    result.model = 'Model Predictions';
    result.reference = 'Dataset Annotations';
  } else {
    result.model = 'Model Predictions';
    result.reference = null;
  }
  return result;
}

export interface IInferenceResultChangeEvent {
  renderer1: IColoredInferencePrediction[];
  renderer2?: IColoredInferencePrediction[];
}

@Component({
  selector: 'wb-inference-results',
  templateUrl: './inference-results.component.html',
  styleUrls: ['./inference-results.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InferenceResultsComponent {
  @Input() modelTask: SUPPORTED_TASK_TYPE;

  @Input() predictions: IColoredInferencePrediction[] = [];

  @Input() refPredictions: IColoredInferencePrediction[] = [];

  @Input() accuracyReportMode = false;

  @Input() labelSet: ILabelSet = { id: 0, name: 'none', labels: {} };

  @Input() mode: VisualizationMode = 'default';

  @Output() selectedPredictionsChange = new EventEmitter<IInferenceResultChangeEvent>();

  readonly taskTypes = ModelTaskTypes;

  readonly hints = this._messagesService.hintMessages.networkOutputVisualization;

  constructor(private _messagesService: MessagesService) {}
}
