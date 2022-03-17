import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wb-raw-text-dataset-preview',
  templateUrl: './raw-text-dataset-preview.component.html',
  styleUrls: ['./raw-text-dataset-preview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RawTextDatasetPreviewComponent {
  @Input() dataset: string[][] = null;
}
