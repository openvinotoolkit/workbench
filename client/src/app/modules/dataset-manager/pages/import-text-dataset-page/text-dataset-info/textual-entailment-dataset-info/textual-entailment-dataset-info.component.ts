import { ChangeDetectionStrategy, Component } from '@angular/core';

import { MessagesService } from '@core/services/common/messages.service';

@Component({
  selector: 'wb-textual-entailment-dataset-info',
  templateUrl: './textual-entailment-dataset-info.component.html',
  styleUrls: ['./textual-entailment-dataset-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextualEntailmentDatasetInfoComponent {
  readonly hints = this._messages.hintMessages.textDatasetInfo;

  constructor(private _messages: MessagesService) {}
}
