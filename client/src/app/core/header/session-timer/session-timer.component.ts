import { ChangeDetectionStrategy, Component } from '@angular/core';

import { SessionService } from '@core/services/common/session.service';
import { MessagesService } from '@core/services/common/messages.service';

@Component({
  selector: 'wb-session-timer',
  templateUrl: './session-timer.component.html',
  styleUrls: ['./session-timer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionTimerComponent {
  constructor(public sessionService: SessionService, public messagesService: MessagesService) {}
}
