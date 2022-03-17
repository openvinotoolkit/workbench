import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

import { MessagesService } from '@core/services/common/messages.service';

import { IInferenceExecutionInfo } from '@store/inference-result-store/inference-result.model';

@Component({
  selector: 'wb-execution-attributes',
  templateUrl: './execution-attributes.component.html',
  styleUrls: ['./execution-attributes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExecutionAttributesComponent {
  @Input()
  execInfo: IInferenceExecutionInfo;

  public execAttributeTipMessages = this.messagesService.hintMessages.execAttributes;

  constructor(private messagesService: MessagesService) {}
}
