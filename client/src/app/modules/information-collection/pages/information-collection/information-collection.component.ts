import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';

import { MessagesService } from '@core/services/common/messages.service';

@Component({
  selector: 'wb-information-collection',
  templateUrl: './information-collection.component.html',
  styleUrls: ['./information-collection.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InformationCollectionComponent {
  public softwareImprovementProgramTip: string;
  public softwareImprovementProgramLink: string;

  constructor(public router: Router, private messagesService: MessagesService) {
    this.softwareImprovementProgramTip = this.messagesService.getHint(
      'informationCollection',
      'softwareImprovementProgram'
    );
    this.softwareImprovementProgramLink = this.messagesService.getHint('informationCollection', 'infoLink');
  }
}
