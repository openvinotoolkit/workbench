import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { Dictionary } from '@ngrx/entity';

type ButtonType = 'primary' | 'secondary' | 'default';
type ButtonIconPosition = 'before' | 'after';

@Component({
  selector: 'wb-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {
  @Input()
  type: ButtonType = 'default';

  @Input()
  text: string;

  @Input()
  disabled = false;

  @Input()
  pending = false;

  @Input()
  icon: string;

  @Input()
  iconPosition: ButtonIconPosition = 'before';

  @Output()
  handleClick: EventEmitter<MouseEvent> = new EventEmitter<MouseEvent>();

  @Input()
  testId: string;

  readonly classNames = {
    button: 'button',
    disabled: 'disabled',
    pending: 'pending',
    matStrokedButton: 'mat-stroked-button',
    matFlatButton: 'mat-flat-button',
    iconSuffix: 'icon-suffix',
  };

  get classNamesDict(): Dictionary<boolean> {
    const { matStrokedButton, matFlatButton, button, disabled, pending, iconSuffix } = this.classNames;
    return {
      [matStrokedButton]: this.type === 'secondary',
      [matFlatButton]: this.type !== 'secondary',
      [`${button} ${button}-${this.type}`]: true,
      [disabled]: this.disabled,
      [iconSuffix]: this.iconPosition === 'after',
    };
  }
}
