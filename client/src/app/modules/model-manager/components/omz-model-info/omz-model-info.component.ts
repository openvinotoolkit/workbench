import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

import { ModelDownloaderDTO } from '@shared/models/dto/model-downloader-dto';

// TODO [82812] Remove deprecated component
@Component({
  selector: 'wb-omz-model-info',
  templateUrl: './omz-model-info.component.html',
  styleUrls: ['./omz-model-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OmzModelInfoComponent {
  @Input()
  modelInfo: ModelDownloaderDTO;
}
