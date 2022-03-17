import { ChangeDetectionStrategy, Component } from '@angular/core';

import { MessagesService } from '@core/services/common/messages.service';

@Component({
  selector: 'wb-explainable-ai-description',
  templateUrl: './explainable-ai-description.component.html',
  styleUrls: ['./explainable-ai-description.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExplainableAiDescriptionComponent {
  readonly description = this._messagesService.hintMessages.networkOutputVisualization.explainableAiDescription;

  constructor(private _messagesService: MessagesService) {}
}
