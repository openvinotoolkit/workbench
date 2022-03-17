import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
  selector: 'wb-color-label',
  templateUrl: './color-label.component.html',
  styleUrls: ['./color-label.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorLabelComponent {
  @Input() color: string;

  private _labels = [];
  @Input() set label(value: string) {
    this._labels = value.split(' ');
  }

  get labels(): string[] {
    return this._labels;
  }
}
