import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  Output,
} from '@angular/core';

export interface IModelZooFilterOptionChangeEvent<T> {
  selected: boolean;
  value: T;
}

@Component({
  selector: 'wb-model-zoo-filter-option',
  templateUrl: 'model-zoo-filter-option.component.html',
  styleUrls: ['./model-zoo-filter-option.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelZooFilterOptionComponent<T> {
  @Input() value: T = null;

  @HostBinding('class.selected') @Input() selected = false;

  @HostBinding('class.disabled') @Input() disabled = false;

  @Output() selectionChange = new EventEmitter<IModelZooFilterOptionChangeEvent<T>>();

  constructor(readonly elementRef: ElementRef) {}

  @HostListener('click') select(): void {
    if (!this.selected && !this.disabled) {
      this.selected = true;
      this._emitChange();
    }
  }

  deselect(event: Event): void {
    if (this.selected && !this.disabled) {
      event.stopPropagation();
      this.selected = false;
      this._emitChange();
    }
  }

  private _emitChange(): void {
    this.selectionChange.emit({ selected: this.selected, value: this.value });
  }
}
