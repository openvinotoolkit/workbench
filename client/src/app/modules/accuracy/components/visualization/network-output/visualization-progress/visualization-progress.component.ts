import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { MessagesService } from '@core/services/common/messages.service';

import { IInferenceTestImagePipeline } from '@shared/models/pipelines/inference-test-image-pipeline';

@Component({
  selector: 'wb-visualization-progress',
  templateUrl: './visualization-progress.component.html',
  styleUrls: ['./visualization-progress.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VisualizationProgressComponent {
  @Input() pipeline: IInferenceTestImagePipeline = null;
  @Input() explain = false;

  @Output() cancel = new EventEmitter<void>();

  cancelled = false;

  readonly message = this._messagesService.hintMessages.networkOutputVisualization.progressMessage;

  constructor(private _messagesService: MessagesService) {}
}
