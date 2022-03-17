import { Component, EventEmitter, Input, Output } from '@angular/core';

import { MessagesService } from '@core/services/common/messages.service';

import { UserMetaInfo } from '@store/globals-store/globals.state';

@Component({
  selector: 'wb-user-panel',
  templateUrl: './user-panel.component.html',
  styleUrls: ['./user-panel.component.scss'],
})
export class UserPanelComponent {
  @Input()
  version: string;

  @Input()
  userMeta: UserMetaInfo;

  @Input()
  isLogoutAvailable = true;

  @Input()
  isDisabled = false;

  @Input()
  token: string;

  @Output()
  logoutUser = new EventEmitter<void>();

  @Output()
  downloadLog = new EventEmitter<void>();

  @Output()
  eraseAll = new EventEmitter<void>();

  @Output()
  setGAStatusEvent = new EventEmitter<boolean>();

  public GATip = this.messagesService.hintMessages.informationCollection.moreInfo;
  readonly versionPlaceholder = 'version';

  constructor(private messagesService: MessagesService) {}
}
