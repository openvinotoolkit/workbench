import {
  AfterContentInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  QueryList,
  Renderer2,
  ViewChild,
} from '@angular/core';

import { startWith, takeUntil } from 'rxjs/operators';
import { merge } from 'rxjs';

import { ModelZooFilterOptionComponent } from './model-zoo-filter-option/model-zoo-filter-option.component';

@Component({
  selector: 'wb-model-zoo-filter',
  templateUrl: './model-zoo-filter.component.html',
  styleUrls: ['./model-zoo-filter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelZooFilterComponent<T> implements AfterContentInit, OnDestroy {
  @Input() group: string = null;

  @Output() readonly optionsChange = new EventEmitter<T[]>();

  @ContentChildren(ModelZooFilterOptionComponent) options: QueryList<ModelZooFilterOptionComponent<T>> = null;
  @ViewChild('container', { static: true }) container: ElementRef = null;

  readonly selectedOptions = new Set<T>();

  readonly optionsLimit = 10;

  private readonly _unsubscribe$ = new EventEmitter<void>();
  hiddenOptions: ModelZooFilterOptionComponent<T>[] = [];

  constructor(
    private readonly _elementRef: ElementRef,
    private readonly _renderer: Renderer2,
    private readonly _cdr: ChangeDetectorRef
  ) {}

  ngAfterContentInit(): void {
    this.options.changes
      .pipe(startWith(null as unknown), takeUntil(this._unsubscribe$))
      .subscribe(() => this._resetOptions());
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  private _resetOptions(): void {
    this.hideOptions();
    this._cdr.detectChanges();

    const changedOrDestroyed$ = merge(this.options.changes, this._unsubscribe$);

    merge(...this.options.map((filterOptionComponent) => filterOptionComponent.selectionChange))
      .pipe(takeUntil(changedOrDestroyed$))
      .subscribe(({ selected, value }) => {
        selected ? this.selectedOptions.add(value) : this.selectedOptions.delete(value);
        this._cdr.detectChanges();
        this.optionsChange.next(Array.from(this.selectedOptions.values()));
      });
  }

  get isClearSelectionAvailable(): boolean {
    return !!this.options.find(({ selected, disabled }) => selected && !disabled);
  }

  clearSelectedOptions(): void {
    const availableSelectedOptions = this.options.filter(({ selected, disabled }) => selected && !disabled);
    for (const option of availableSelectedOptions) {
      option.deselect(new Event('click'));
    }
  }

  hideOptions(): void {
    this.hiddenOptions = this.options.toArray().slice(this.optionsLimit);
    for (const option of this.hiddenOptions) {
      this._renderer.removeChild(this.container.nativeElement, option.elementRef.nativeElement);
    }
  }

  showOptions(): void {
    for (const option of this.hiddenOptions) {
      this._renderer.appendChild(this.container.nativeElement, option.elementRef.nativeElement);
    }
    this.hiddenOptions = [];
  }
}

@Component({
  selector: 'wb-model-zoo-filter-title',
  template: '<ng-content></ng-content>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelZooFilterTitleComponent {}
