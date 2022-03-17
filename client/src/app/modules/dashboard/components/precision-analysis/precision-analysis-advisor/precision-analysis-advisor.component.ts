import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { animate, keyframes, style, transition, trigger } from '@angular/animations';

import { includes, isEmpty } from 'lodash';

import { MessagesService } from '@core/services/common/messages.service';
import { AnimationService, AnimationTargetElement, HighlightAnimation } from '@core/services/common/animation.service';

import { ModelDomain, ModelItem, ModelPrecisionEnum, ModelSources } from '@store/model-store/model.model';
import {
  ILayerTimePrecisionDistribution,
  IPrecisionAnalysisAdviceMessage,
} from '@store/inference-result-store/inference-result.model';
import { ProjectItem } from '@store/project-store/project.model';

import { DeviceTargets } from '@shared/models/device';

import { ExecutedLayerItem } from '../../model-layers-with-graphs/layers-table/layers-table.model';
import { PrecisionAnalysisService } from '../precision-analysis.service';
import { PrecisionAnalysisAdvisorService } from './precision-analysis-advisor.service';

@Component({
  selector: 'wb-precision-analysis-advisor',
  templateUrl: './precision-analysis-advisor.component.html',
  styleUrls: ['./precision-analysis-advisor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('highlight', [
      transition('false => true', [
        animate(
          '2s',
          keyframes([
            style({
              borderColor: '#e3e3e3',
              backgroundColor: '#f8f8f8',
              offset: 0,
            }),
            style({
              backgroundColor: ' #e5f0fb',
              offset: 0.4,
            }),
            style({
              borderColor: '#1738c6',
              offset: 0.5,
            }),
            style({
              backgroundColor: ' #e5f0fb',
              offset: 0.8,
            }),
            style({
              borderColor: '#1738c6',
              offset: 0.9,
            }),
            style({
              borderColor: '#e3e3e3',
              backgroundColor: '#f8f8f8',
              offset: 1,
            }),
          ])
        ),
      ]),
    ]),
  ],
})
export class PrecisionAnalysisAdvisorComponent extends HighlightAnimation implements OnChanges {
  @Input()
  optimizations: string[];

  private _model: ModelItem;
  @Input() set model(model: ModelItem) {
    if (!model) {
      return;
    }
    this._model = model;
  }

  private _project: ProjectItem;
  @Input() set project(value: ProjectItem) {
    if (!value) {
      return;
    }
    this._project = value;
  }

  private _layers: ExecutedLayerItem[];
  @Input() set layers(value: ExecutedLayerItem[]) {
    if (isEmpty(value)) {
      return;
    }
    this._layers = value;
    this.unquantizedConvolutionsPresent = this.precisionAnalysisService.unquantizedConvLayesPresent(this._layers);
    const fp16Share = this.precisionAnalysisService.calculateFP16Share(this._layers);
    this.goToFP16Message = this.messagesService.getPrecisionAnalysisHint('generalRules', 'goToFP16', {
      fp16Share: `${fp16Share * 100}%`,
    });
  }

  private _layersPrecisionDistribution: ILayerTimePrecisionDistribution[] = [];
  @Input() set layersPrecisionDistribution(value) {
    if (isEmpty(value)) {
      return;
    }
    this._layersPrecisionDistribution = value;
    this.reordersShare = this.precisionAnalysisService.calculateReordersShare(this._layersPrecisionDistribution);

    this.reordersOverloadMessage = this.messagesService.getPrecisionAnalysisHint('generalRules', 'reordersOverload', {
      reordersShare: `${this.reordersShare * 100}%`,
    });
    this.reordersOverloadQuantizedMessage = this.messagesService.getPrecisionAnalysisHint(
      'generalRules',
      'reordersOverloadInt8',
      { reordersShare: `${this.reordersShare * 100}%` }
    );
    this.precisionDistribution = this.precisionAnalysisService.calculatePrecisionDistribution(
      this._layersPrecisionDistribution
    );
  }

  public reordersShare = 0;
  public precisionDistribution: { [key in ModelPrecisionEnum]?: number } = {
    [ModelPrecisionEnum.FP32]: 0,
    [ModelPrecisionEnum.FP16]: 0,
    [ModelPrecisionEnum.I8]: 0,
  };
  public unquantizedConvolutionsPresent: boolean;

  public calibrateModelFirstMessage: IPrecisionAnalysisAdviceMessage;
  public unquantizedConvolutionsMessage: IPrecisionAnalysisAdviceMessage;
  public advisorMessages: IPrecisionAnalysisAdviceMessage[] = [];
  public goToFP16Message: IPrecisionAnalysisAdviceMessage;
  public reordersOverloadMessage: IPrecisionAnalysisAdviceMessage;
  public reordersOverloadQuantizedMessage: IPrecisionAnalysisAdviceMessage;

  public isEmpty = isEmpty;

  constructor(
    public el: ElementRef,
    public cdr: ChangeDetectorRef,
    public animationService: AnimationService,
    private messagesService: MessagesService,
    private precisionAnalysisService: PrecisionAnalysisService,
    private precisionAnalysisAdvisorService: PrecisionAnalysisAdvisorService
  ) {
    super(el, cdr, animationService, AnimationTargetElement.ADVISOR);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this._project || !this._layersPrecisionDistribution || !this._model) {
      return;
    }
    this.advisorMessages = this.setAdvisorMessages();

    this.precisionAnalysisAdvisorService.setHasAdvicesAs(this.advisorMessages.length > 0);
  }

  setCalibrateModelFirstMessage(int8Share: number, projectId: number): void {
    this.calibrateModelFirstMessage = this.messagesService.getPrecisionAnalysisHint(
      'calibrationMessages',
      'calibrateFirst',
      {
        int8Share: `${Math.round(int8Share * 100)}%`,
      },
      {
        projectId,
      }
    );
  }

  setUnquantizedConvolutionsMessage(fpConvShare: number, projectId: number): void {
    this.unquantizedConvolutionsMessage = this.messagesService.getPrecisionAnalysisHint(
      'calibrationMessages',
      'unquantizedConvolutions',
      {
        fpConvShare: `${Math.round(fpConvShare * 100)}%`,
      },
      {
        projectId,
      }
    );
  }

  private setAdvisorMessages(): IPrecisionAnalysisAdviceMessage[] {
    const messages = [];
    const isInt8Available = includes(this.optimizations?.[this._project?.deviceId], ModelPrecisionEnum.I8);
    const isCvDomain = this._model?.domain === ModelDomain.CV;
    if (isCvDomain && !this._project?.analysisData.isInt8 && isInt8Available) {
      const int8Share = this.precisionAnalysisService.calculateInt8Share(this._layers);
      this.setCalibrateModelFirstMessage(int8Share, this._project.id);
      messages.push(this.calibrateModelFirstMessage);
    }
    if (
      this.unquantizedConvolutionsPresent &&
      this._project?.analysisData.isInt8 &&
      this._model?.modelSource !== ModelSources.OMZ
    ) {
      const fpConvShare = this.precisionAnalysisService.calculateFPConvShare(this._layers);
      this.setUnquantizedConvolutionsMessage(fpConvShare, this._project.parentId);
      messages.push(this.unquantizedConvolutionsMessage);
    }
    if (this._project?.deviceType === DeviceTargets.GPU && this.precisionDistribution.FP32 > 0.15) {
      messages.push(this.goToFP16Message);
    }
    if (this.reordersShare > 0.1) {
      messages.push(
        this._project?.analysisData.isInt8 ? this.reordersOverloadQuantizedMessage : this.reordersOverloadMessage
      );
    }
    return messages;
  }
}
