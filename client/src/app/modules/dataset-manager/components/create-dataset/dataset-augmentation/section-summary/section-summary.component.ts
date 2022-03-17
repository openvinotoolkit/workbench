import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
  selector: 'wb-section-summary',
  templateUrl: './section-summary.component.html',
  styleUrls: ['./section-summary.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionSummaryComponent {
  @Input()
  images: number;
}
