import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';

@Component({
  selector: 'wb-ratio-bar',
  templateUrl: './ratio-bar.component.html',
  styleUrls: ['./ratio-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RatioBarComponent implements OnChanges {
  @Input() normalizeTo: number = null;

  @Input() percent: number = null;

  @Input() baseHue = 266;

  @Input() jetColorMap = false;

  @Input() lighten = true;

  width: string = null;
  backgroundColor: string = null;

  ngOnChanges() {
    this.width = `${(this.percent / this.normalizeTo) * 100}%`;

    if (this.jetColorMap) {
      return;
    }

    this.backgroundColor = this._getBackgroundColor(this.percent, this.lighten ? this.normalizeTo : this.percent);
  }

  private _getBackgroundColor(percent: number, normalizeTo: number): string {
    const min = 20;
    const max = 90;
    const normalizedScore = percent / normalizeTo;

    const lightness = max - (max - min) * normalizedScore;

    return `hsl(${this.baseHue}, 50%, ${lightness}%)`;
  }
}
