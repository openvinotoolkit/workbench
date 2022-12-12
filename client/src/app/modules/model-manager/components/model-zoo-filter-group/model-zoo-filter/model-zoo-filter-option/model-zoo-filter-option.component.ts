import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
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
  @Input() icon: string = null;

  @Input() value: T = null;

  @Input() testId: string;

  @HostBinding('class.selected') @Input() selected = false;

  @HostBinding('class.disabled') @Input() disabled = false;

  @Output() selectionChange = new EventEmitter<IModelZooFilterOptionChangeEvent<T>>();

  constructor(readonly elementRef: ElementRef, private readonly _cdr: ChangeDetectorRef) {}

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
      this._cdr.detectChanges();
      this._emitChange();
    }
  }

  private _emitChange(): void {
    this.selectionChange.emit({ selected: this.selected, value: this.value });
  }
}
