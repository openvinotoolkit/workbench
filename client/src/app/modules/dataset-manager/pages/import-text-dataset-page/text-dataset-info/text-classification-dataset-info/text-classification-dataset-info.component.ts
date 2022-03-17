import { ChangeDetectionStrategy, Component } from '@angular/core';

import { MessagesService } from '@core/services/common/messages.service';

@Component({
  selector: 'wb-text-classification-dataset-info',
  templateUrl: './text-classification-dataset-info.component.html',
  styleUrls: ['./text-classification-dataset-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextClassificationDatasetInfoComponent {
  readonly hints = this._messages.hintMessages.textDatasetInfo;

  constructor(private _messages: MessagesService) {}
}
