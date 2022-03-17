import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { IFormattedDataset } from '../../text-dataset-data.component';

@Component({
  selector: 'wb-data-text-dataset-preview',
  templateUrl: './data-text-dataset-preview.component.html',
  styleUrls: ['./data-text-dataset-preview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTextDatasetPreviewComponent {
  @Input() formattedDataset: IFormattedDataset = null;
}
