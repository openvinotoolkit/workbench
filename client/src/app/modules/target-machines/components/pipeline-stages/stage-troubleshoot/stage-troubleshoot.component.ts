import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

import { MessagesService } from '@core/services/common/messages.service';

import {
  pipelineStageErrorNameMap,
  pipelineStageWarningsNameMap,
} from '@shared/models/pipelines/target-machines/configure-target-pipeline';

type MessageType = 'error' | 'warning';

@Component({
  selector: 'wb-stage-troubleshoot',
  templateUrl: './stage-troubleshoot.component.html',
  styleUrls: ['./stage-troubleshoot.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StageTroubleshootComponent {
  @Input()
  message: string;

  @Input()
  expanded = false;

  @Input()
  messageType: MessageType;

  warningMessages = require('../../../../../../assets/data/remote-target-warning-messages.json') || {};
  private readonly errorKey = 'remote-target-machine';

  constructor(private messagesService: MessagesService) {}

  getErrorName(message) {
    if (this.messageType === 'error') {
      return pipelineStageErrorNameMap[message] || message;
    }
    return pipelineStageWarningsNameMap[message] || message;
  }

  getMessage(message) {
    if (this.messageType === 'error') {
      return this.messagesService.getError(this.errorKey, message);
    }
    return this.warningMessages[message] || message;
  }
}
