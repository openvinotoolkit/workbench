import { ChangeDetectionStrategy, Component } from '@angular/core';

import { MessagesService } from '@core/services/common/messages.service';

@Component({
  selector: 'wb-text-dataset-info',
  templateUrl: './text-dataset-info.component.html',
  styleUrls: ['./text-dataset-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextDatasetInfoComponent {
  readonly hints = this._messages.hintMessages.textDatasetInfo;

  constructor(private _messages: MessagesService) {}
}
