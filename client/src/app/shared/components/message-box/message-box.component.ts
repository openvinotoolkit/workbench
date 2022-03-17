import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, Output } from '@angular/core';
import { animate, keyframes, style, transition, trigger } from '@angular/animations';

import { MessagesService } from '@core/services/common/messages.service';
import { NotificationType } from '@core/services/common/notification.service';
import { AnimationTargetElement, AnimationService, HighlightAnimation } from '@core/services/common/animation.service';

enum detailsButton {
  SHOW = 'show',
  HIDE = 'hide',
}

@Component({
  selector: 'wb-message-box',
  templateUrl: './message-box.component.html',
  styleUrls: ['./message-box.component.scss'],
  animations: [
    trigger('highlight', [
      transition('false => true', [
        animate(
          2000,
          keyframes([
            style({
              borderColor: '#6d0f3f',
              offset: 0.6,
            }),
            style({
              backgroundColor: '#e3e3e3',
              offset: 1,
            }),
          ])
        ),
      ]),
    ]),
  ],
})
export class MessageBoxComponent extends HighlightAnimation {
  @Output() tryAgain: EventEmitter<void> = new EventEmitter<void>();

  @Input()
  public messageType: NotificationType = NotificationType.DEFAULT;

  @Input()
  public message: string;

  @Input()
  public detailedMessage: string;

  @Input()
  public isTryAgainAvailable = false;

  public showDetails = false;

  public readonly labels = {
    showDetails: 'Show Details',
    hideDetails: 'Hide Details',
    copyLog: 'Copy Error Log',
  };

  public detailsButton = detailsButton;

  public readonly feedbackDescription = this._messageService.hintMessages.feedback.messageBoxFeedback;
  public readonly errorMessageType = 'error';

  constructor(
    public el: ElementRef,
    public cdr: ChangeDetectorRef,
    public animationService: AnimationService,
    private _messageService: MessagesService
  ) {
    super(el, cdr, animationService, AnimationTargetElement.MESSAGE_BOX);
  }
}
