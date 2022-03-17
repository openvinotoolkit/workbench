import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';

import { Store } from '@ngrx/store';
import { map, take } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { orderBy } from 'lodash';

import { MessagesService } from '@core/services/common/messages.service';

import { InferenceTestImageStoreActions, InferenceTestImageStoreSelectors, RootStoreState } from '@store';
import { ModelTaskTypes, TaskTypeToNameMap } from '@store/model-store/model.model';
import { IInferencePrediction } from '@store/inference-test-image-store/inference-test-image-models';

import { ColorCodingService } from '../../../color-coding.service';
import { ImageRendererComponent, ImageRendererDrawMode } from './image-renderer/image-renderer.component';
import { PaintingCanvasManagerService } from './painting-canvas-manager.service';
import { VisualizationType } from './original-image-controls/original-image-controls.component';
import { SUPPORTED_TASK_TYPE } from '../network-output-visualizer/network-output-visualizer.component';
import { getPredictionsTitles, IInferenceResultChangeEvent } from './inference-results/inference-results.component';

export type VisualizationMode = 'default' | 'explain' | 'dataset_annotations' | 'parent_model_predictions';

export interface INetworkOutputTestEvent {
  file: File;
  mask?: File;
  visualizationType: VisualizationType;
}

export interface IInferencePredictionColors {
  primary: string;
  mask: string;
  activeStyles: { [prop: string]: string };
}

export interface IColoredInferencePrediction extends IInferencePrediction {
  colors: IInferencePredictionColors;
}

@Component({
  selector: 'wb-network-output',
  templateUrl: './network-output.component.html',
  styleUrls: ['./network-output.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [PaintingCanvasManagerService],
})
export class NetworkOutputComponent implements OnInit, OnDestroy {
  private _taskType: SUPPORTED_TASK_TYPE = null;
  @Input() set taskType(value: SUPPORTED_TASK_TYPE) {
    this._taskType = value;
    this.mode = 'default';
    this.resetPredictions();
  }

  get taskType(): SUPPORTED_TASK_TYPE {
    return this._taskType;
  }

  @Input() disabled = false;

  @Input() parentModelVisualizationAvailable = false;

  @Input() accuracyReportMode = false;

  @Output() test = new EventEmitter<INetworkOutputTestEvent>();

  readonly infering$ = this._store$.select(InferenceTestImageStoreSelectors.selectInfering);

  readonly pipeline$ = this._store$.select(InferenceTestImageStoreSelectors.selectInferingPipeline);

  readonly error$ = this._store$.select(InferenceTestImageStoreSelectors.selectError);

  get titles(): { model: string; reference: string } {
    return getPredictionsTitles(this.mode);
  }

  fileTypeError = false;

  imageFile: File;

  readonly ACCEPTED_MIME_TYPES = 'image/jpeg,image/png,image/jpg';
  readonly modelTaskTypes = ModelTaskTypes;

  readonly hints = this._messagesService.hintMessages.networkOutputVisualization;
  readonly visualizationError = this._messagesService.errorMessages.networkOutputVisualization.visualizationFailed;
  renderer1Predictions: IColoredInferencePrediction[] = null;
  renderer2Predictions: IColoredInferencePrediction[] = null;

  readonly imagePredictions$: Observable<{
    predictions: IColoredInferencePrediction[];
    refPredictions?: IColoredInferencePrediction[];
  }> = this._store$.select(InferenceTestImageStoreSelectors.selectTestImage).pipe(
    map((testImage) => {
      if (!testImage) {
        return null;
      }
      return this._colorCodingService.toColoredPredictions(
        orderBy(testImage.predictions, 'score', 'desc'),
        testImage.refPredictions ? orderBy(testImage.refPredictions, 'score', 'desc') : null
      );
    })
  );

  readonly TASK_TYPE_TO_PREDICTION_HINT = {
    [ModelTaskTypes.CLASSIFICATION]: this.hints.classificationPredictions,
    [ModelTaskTypes.STYLE_TRANSFER]: this.hints.ganPrediction,
    [ModelTaskTypes.INPAINTING]: this.hints.ganPrediction,
    [ModelTaskTypes.SUPER_RESOLUTION]: this.hints.ganPrediction,
  };

  readonly taskTypeToNameMap = TaskTypeToNameMap;

  readonly imageRendererDrawMode = ImageRendererDrawMode;

  @ViewChild(ImageRendererComponent) imageRendererComponent: ImageRendererComponent;

  public mode: VisualizationMode = 'default';

  constructor(
    private _store$: Store<RootStoreState.State>,
    private _cdr: ChangeDetectorRef,
    private _colorCodingService: ColorCodingService,
    private _messagesService: MessagesService
  ) {}

  ngOnInit() {
    this._store$.dispatch(InferenceTestImageStoreActions.resetAccuracyState());
    this._store$.dispatch(InferenceTestImageStoreActions.loadLabelSets());
  }

  ngOnDestroy() {
    this.reset();
  }

  async reset(): Promise<void> {
    await this.cancel();
    this._store$.dispatch(InferenceTestImageStoreActions.resetAccuracyState());
    this.renderer1Predictions = null;
    this.renderer2Predictions = null;
    this.fileTypeError = false;
    this.imageFile = null;
  }

  resetPredictions() {
    this._store$.dispatch(InferenceTestImageStoreActions.resetTestImage());
    this.renderer1Predictions = null;
    this.renderer2Predictions = null;
  }

  onFileChange(file: File) {
    if (!file) {
      return;
    }

    this.mode = 'default';
    this.fileTypeError = false;
    this._store$.dispatch(InferenceTestImageStoreActions.resetTestImage());
    this.renderer1Predictions = null;
    this.renderer2Predictions = null;
    if (!this._isFileTypeValid(file)) {
      this.fileTypeError = true;
      this.imageFile = null;
      return;
    }

    this.imageFile = file;
    this._cdr.detectChanges();
  }

  async emitTest({ visualizationType }: { visualizationType: VisualizationType }): Promise<void> {
    if (visualizationType === 'explain') {
      this.mode = 'explain';
    } else if (visualizationType === 'ref_visualization') {
      this.mode = 'parent_model_predictions';
    } else {
      this.mode = 'default';
    }

    let mask: File;
    if (this.getDrawMode() === ImageRendererDrawMode.INPAINTING) {
      const maskBlob = await this.imageRendererComponent.getMaskBlob();
      mask = new File([maskBlob], 'mask.png');
    }

    this.renderer1Predictions = null;
    this.renderer2Predictions = null;
    this.test.emit({ file: this.imageFile, mask, visualizationType });
  }

  async cancel(): Promise<void> {
    const infering = await this.infering$.pipe(take(1)).toPromise();
    if (infering) {
      this._store$.dispatch(InferenceTestImageStoreActions.cancelInferencePipeline());
    }
  }

  onSelectedPredictionsChange({ renderer1, renderer2 }: IInferenceResultChangeEvent): void {
    this.renderer1Predictions = renderer1;
    this.renderer2Predictions = renderer2;
    this._cdr.detectChanges();
  }

  private _isFileTypeValid(file: File): boolean {
    return this.ACCEPTED_MIME_TYPES.split(',').includes(file.type);
  }

  getDrawMode(): ImageRendererDrawMode {
    return {
      [ModelTaskTypes.CLASSIFICATION]: null,
      [ModelTaskTypes.OBJECT_DETECTION]: ImageRendererDrawMode.BOX,
      [ModelTaskTypes.SEMANTIC_SEGMENTATION]: ImageRendererDrawMode.MASK,
      [ModelTaskTypes.INSTANCE_SEGMENTATION]: ImageRendererDrawMode.MASK,
      [ModelTaskTypes.INPAINTING]: ImageRendererDrawMode.INPAINTING,
    }[this.taskType];
  }
}
