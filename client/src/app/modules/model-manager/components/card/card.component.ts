import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  Output,
} from '@angular/core';

@Component({
  selector: 'wb-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {
  @HostBinding('class.disabled') @Input() disabled = false;

  @Output() selected = new EventEmitter<void>();

  @HostListener('click') onClick(): void {
    if (!this.disabled) {
      this.selected.emit();
    }
  }
}

@Component({
  selector: 'wb-card-title-row',
  template: '<ng-content></ng-content>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardTitleRowComponent {}

@Component({
  selector: 'wb-card-content-row',
  template: '<ng-content select="wb-card-content-row-item"></ng-content>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardContentRowComponent {}

@Component({
  selector: 'wb-card-content-row-item',
  template: '<ng-content></ng-content>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardContentRowItemComponent {}
