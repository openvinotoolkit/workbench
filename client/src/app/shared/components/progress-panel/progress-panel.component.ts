import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { MessagesService } from '@core/services/common/messages.service';

import { IAccuracyPipeline } from '@store/accuracy-analysis-store/accuracy-analysis-store.models';

@Component({
  selector: 'wb-progress-panel',
  templateUrl: './progress-panel.component.html',
  styleUrls: ['./progress-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressPanelComponent {
  @Input() title = 'Progress';

  @Input() pipeline: IAccuracyPipeline = null;

  @Input() cancellable = false;

  @Output() cancel = new EventEmitter<void>();

  public cancelled = false;

  readonly message = this._messagesService.hintMessages.networkOutputVisualization.progressMessage;

  constructor(private _messagesService: MessagesService) {}
}
