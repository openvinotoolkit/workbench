import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'wb-switch-button',
  templateUrl: './switch-button.component.html',
  styleUrls: ['./switch-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SwitchButtonComponent {
  @Input()
  leftOptionLabel: string;

  @Input()
  rightOptionLabel: string;

  leftOptionCheckedValue = true;

  @Input()
  get leftOptionChecked() {
    return this.leftOptionCheckedValue;
  }

  @Input()
  tooltipMessage: string;

  @Output()
  leftOptionCheckedChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  set leftOptionChecked(value) {
    if (this.leftOptionCheckedValue === value) {
      return;
    }
    this.leftOptionCheckedValue = value;
    this.leftOptionCheckedChange.emit(this.leftOptionCheckedValue);
  }
}
