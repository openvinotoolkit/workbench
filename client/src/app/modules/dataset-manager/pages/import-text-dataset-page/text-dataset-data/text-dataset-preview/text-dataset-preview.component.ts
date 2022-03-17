import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { IFormattedDataset } from '../text-dataset-data.component';

@Component({
  selector: 'wb-text-dataset-preview',
  templateUrl: './text-dataset-preview.component.html',
  styleUrls: ['./text-dataset-preview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextDatasetPreviewComponent {
  @Input() dataset: string[][] = null;

  @Input() formattedDataset: IFormattedDataset = null;
}
