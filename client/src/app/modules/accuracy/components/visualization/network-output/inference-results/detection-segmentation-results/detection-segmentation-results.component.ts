import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
} from '@angular/core';
import { UntypedFormControl } from '@angular/forms';

import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { isNumber } from 'lodash';

import { ILabelSet } from '@store/inference-test-image-store/inference-test-image-models';
import { ModelTaskTypes } from '@store/model-store/model.model';

import { IColoredInferencePrediction, VisualizationMode } from '../../network-output.component';
import { getPredictionsTitles, IInferenceResultChangeEvent } from '../inference-results.component';

type DETECTION_SEGMENTATION_TASK_TYPE =
  | ModelTaskTypes.OBJECT_DETECTION
  | ModelTaskTypes.INSTANCE_SEGMENTATION
  | ModelTaskTypes.SEMANTIC_SEGMENTATION;

export interface IPredictionsChangeEvent {
  selected: IColoredInferencePrediction[];
  hovered: IColoredInferencePrediction;
}

@Component({
  selector: 'wb-detection-segmentation-results',
  templateUrl: './detection-segmentation-results.component.html',
  styleUrls: ['./detection-segmentation-results.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetectionSegmentationResultsComponent implements OnDestroy {
  @Input() taskType: DETECTION_SEGMENTATION_TASK_TYPE;

  private _predictions: IColoredInferencePrediction[] = [];
  @Input() set predictions(value: IColoredInferencePrediction[]) {
    this._predictions = value;
    this.applyThreshold(this.thresholdControl.value);
  }

  private _refPredictions: IColoredInferencePrediction[] = null;
  @Input() set refPredictions(value: IColoredInferencePrediction[]) {
    if (!value) {
      this._refPredictions = null;
      this.filteredRefPredictions = null;
      return;
    }
    this._refPredictions = value;
    this.applyThreshold(this.thresholdControl.value);
  }

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

  @Input() labelSet: ILabelSet = { id: 0, name: 'none', labels: {} };

  @Output() selectedPredictionsChange = new EventEmitter<IInferenceResultChangeEvent>();

  readonly modelTaskTypes = ModelTaskTypes;

  readonly THRESHOLD_OPTIONS = [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0];

  readonly thresholdControl = new UntypedFormControl(0.8);

  // 'thresholded' predictions passed to object detection predictions component
  filteredPredictions: IColoredInferencePrediction[] = [];
  filteredRefPredictions: IColoredInferencePrediction[] = [];

  // persist selected predictions values from child object detection predictions components
  selectedPredictions: IColoredInferencePrediction[] = [];
  selectedRefPredictions: IColoredInferencePrediction[] = [];
  hoveredPrediction: IColoredInferencePrediction;
  hoveredRefPrediction: IColoredInferencePrediction;

  private readonly _unsubscribe$ = new Subject();

  modelPredictionsTitle: string = null;
  referencePredictionsTitle: string = null;

  constructor(private _cdr: ChangeDetectorRef) {
    this.thresholdControl.valueChanges.pipe(takeUntil(this._unsubscribe$)).subscribe((threshold) => {
      this.applyThreshold(threshold);
      this.emitChange();
    });
  }

  ngOnDestroy() {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  applyThreshold(threshold: number): void {
    if (this.taskType === ModelTaskTypes.SEMANTIC_SEGMENTATION) {
      // there is no score and therefore no threshold for semantic segmentation
      this.filteredPredictions = this._predictions;
      this.filteredRefPredictions = this._refPredictions;
      return;
    }

    this.filteredPredictions = this._predictions.filter(({ score }) => score >= threshold);
    // reference predictions can be either parent model predictions where score is always present
    // either [auto-generated] dataset annotations where score is not exists
    this.filteredRefPredictions = this._refPredictions?.filter(({ score }) => !isNumber(score) || score >= threshold);
  }

  onSelectedPredictionsChange({ selected, hovered }: IPredictionsChangeEvent): void {
    this.selectedPredictions = selected;
    this.hoveredPrediction = hovered;
    this.emitChange();
  }

  onSelectedRefPredictionsChange({ selected, hovered }: IPredictionsChangeEvent): void {
    this.selectedRefPredictions = selected;
    this.hoveredRefPrediction = hovered;
    this.emitChange();
  }

  emitChange(): void {
    if (this.taskType === ModelTaskTypes.OBJECT_DETECTION) {
      const hovered = this.hoveredPrediction || this.hoveredRefPrediction;
      this.selectedPredictionsChange.emit({
        renderer1: hovered ? [hovered] : [...this.selectedPredictions, ...this.selectedRefPredictions],
      });

      return;
    }

    this.selectedPredictionsChange.emit({
      renderer1: this.hoveredPrediction ? [this.hoveredPrediction] : this.selectedPredictions,
      renderer2: this.hoveredRefPrediction ? [this.hoveredRefPrediction] : this.selectedRefPredictions,
    });
  }
}
