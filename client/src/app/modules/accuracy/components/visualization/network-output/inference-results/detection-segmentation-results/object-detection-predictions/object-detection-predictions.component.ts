import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { isNumber } from 'lodash';

import { MessagesService } from '@core/services/common/messages.service';

import { ILabelSet } from '@store/inference-test-image-store/inference-test-image-models';

import { IColoredInferencePrediction } from '../../../network-output.component';
import { IPredictionsChangeEvent } from '../detection-segmentation-results.component';

@Component({
  selector: 'wb-object-detection-predictions',
  templateUrl: './object-detection-predictions.component.html',
  styleUrls: ['./object-detection-predictions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ObjectDetectionPredictionsComponent {
  @Input() title: string;

  @Input() inactive = false;

  private _predictions: IColoredInferencePrediction[] = [];
  @Input() set predictions(value: IColoredInferencePrediction[]) {
    this._predictions = value;

    this.selected.forEach((selectedPrediction) => {
      if (!this._predictions.includes(selectedPrediction)) {
        this.selected.delete(selectedPrediction);
      }
    });

    this.emitChange();
  }

  get predictions(): IColoredInferencePrediction[] {
    return this._predictions;
  }

  @Input() labelSet: ILabelSet = { id: 0, name: 'none', labels: {} };

  @Output() selectionChange = new EventEmitter<IPredictionsChangeEvent>();

  readonly selected = new Set<IColoredInferencePrediction>();

  hovered: IColoredInferencePrediction = null;

  isNumber = isNumber;

  readonly noPredictionsTip = this._messagesService.tooltipMessages.networkOutputVisualization.noPredictions;

  constructor(private _messagesService: MessagesService) {}

  onPredictionClick(prediction: IColoredInferencePrediction): void {
    if (this.selected.has(prediction)) {
      this.selected.delete(prediction);
    } else {
      this.selected.add(prediction);
    }

    this.emitChange();
  }

  onPredictionMouseEnter(prediction: IColoredInferencePrediction): void {
    this.emitChange(prediction);
  }

  onPredictionMouseLeave(): void {
    this.emitChange();
  }

  isActive(prediction: IColoredInferencePrediction): boolean {
    return prediction === this.hovered || (!this.hovered && this.selected.has(prediction));
  }

  emitChange(hovered?: IColoredInferencePrediction): void {
    this.hovered = hovered;
    this.selectionChange.emit({ hovered, selected: Array.from(this.selected) });
  }
}
