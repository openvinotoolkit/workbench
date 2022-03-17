import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

import { MessagesService } from '@core/services/common/messages.service';
import { Categories, GAActions, GoogleAnalyticsService } from '@core/services/common/google-analytics.service';

@Component({
  selector: 'wb-navigation-bar',
  templateUrl: './navigation-bar.component.html',
  styleUrls: ['./navigation-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigationBarComponent {
  @Input() isHomePage = false;

  public feedbackDescription = this.messageService.hintMessages.feedback.navigationPanelFeedback;

  constructor(private messageService: MessagesService, private gAnalyticsService: GoogleAnalyticsService) {}

  linkClicked(): void {
    this.gAnalyticsService.emitEvent(GAActions.CONTACT_DL_WB, Categories.FEEDBACK);
  }
}
