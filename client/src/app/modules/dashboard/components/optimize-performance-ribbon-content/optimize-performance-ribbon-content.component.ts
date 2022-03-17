import { Component, ChangeDetectionStrategy, EventEmitter, Input, Output } from '@angular/core';

import { MessagesService } from '@core/services/common/messages.service';

import { OptimizationJobTypes, ProjectItem, ProjectStatusNames } from '@store/project-store/project.model';
import { ModelDomain, ModelItem } from '@store/model-store/model.model';

@Component({
  selector: 'wb-optimize-performance-ribbon-content',
  templateUrl: './optimize-performance-ribbon-content.component.html',
  styleUrls: ['./optimize-performance-ribbon-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptimizePerformanceRibbonContentComponent {
  @Input() project: ProjectItem = null;
  @Input() model: ModelItem = null;
  @Input() doesDeviceSupportInt8 = false;
  @Input() disabled = true;
  @Input() disabledMessage: string = null;

  @Output() configureOptimization = new EventEmitter<ProjectItem>();

  readonly optimizationHints = this._messagesService.hintMessages.optimizationHints;

  readonly int8CalibrationDescription = this._messagesService.hintMessages.optimizationTips.int8Description;

  readonly archivedProjectWarningMessage = this._messagesService.getHint('common', 'archivedProjectWarning', {
    actionName: 'INT8 Calibration',
  });

  constructor(private readonly _messagesService: MessagesService) {}

  get isOptimizedProject(): boolean {
    return this.project?.configParameters?.optimizationType === OptimizationJobTypes.INT_8;
  }

  get isProjectArchived(): boolean {
    return this.project?.status.name === ProjectStatusNames.ARCHIVED;
  }

  get optimizationDisabledMessage(): string {
    /* Warning hint messages (higher priority) */
    // Task is running or DevCloud not available
    if (this.disabled) {
      return this.disabledMessage;
    }
    if (this.isProjectArchived) {
      return this.archivedProjectWarningMessage;
    }
    if (this.model?.domain === ModelDomain.NLP) {
      return this.optimizationHints.nlpInt8Disabled;
    }
    if (this.isOptimizedProject) {
      return this.optimizationHints.int8Disabled;
    }
    if (this.model?.analysis.isInt8) {
      return this._messagesService.getHint('optimizationHints', 'fakeQuantizeDisabled', {
        modelName: this.model.name,
      });
    }
    if (!this.doesDeviceSupportInt8) {
      return this._messagesService.getHint('optimizationHints', 'targetDisabled', {
        target: this.project.deviceName,
        modelId: this.project.originalModelId,
        datasetId: this.project.datasetId,
      });
    }
    if (this.model?.analysis?.isObsolete) {
      return this.optimizationHints.obsoleteIrInt8Disabled;
    }
    return null;
  }

  get modelSizeImprovement(): number {
    if (!this.isOptimizedProject) {
      return null;
    }
    return this.project?.optimizationImprovements?.modelSize;
  }

  get performanceImprovement(): number {
    if (!this.isOptimizedProject) {
      return null;
    }
    return this.project?.optimizationImprovements?.performance;
  }
}
