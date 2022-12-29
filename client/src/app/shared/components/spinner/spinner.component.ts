import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { LegacyProgressSpinnerMode as ProgressSpinnerMode } from '@angular/material/legacy-progress-spinner';

@Component({
  selector: 'wb-spinner',
  templateUrl: './spinner.component.html',
  styleUrls: ['./spinner.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpinnerComponent {
  @Input() diameter = 40;
  @Input() strokeWidth = 3;
  @Input() value = 0;
  @Input() performance = false;

  get mode(): ProgressSpinnerMode {
    return this.value ? 'determinate' : 'indeterminate';
  }
}
