import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

import { MessagesService } from '@core/services/common/messages.service';

import { InferenceResultModel } from '@store/inference-result-store/inference-result.model';
import { ProjectItem } from '@store/project-store/project.model';
import { ModelItem } from '@store/model-store/model.model';

@Component({
  selector: 'wb-precision-analysis',
  templateUrl: './precision-analysis.component.html',
  styleUrls: ['./precision-analysis.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrecisionAnalysisComponent {
  @Input()
  selectedInferenceResult: InferenceResultModel;

  @Input()
  selectedProject: ProjectItem;

  @Input()
  selectedModel: ModelItem;

  @Input()
  availableOptimizations: string[];

  public analysisUnavailableTipMessage = this.messagesService.hintMessages.precisionAnalysis.analysisUnavailable;

  constructor(private messagesService: MessagesService) {}
}
