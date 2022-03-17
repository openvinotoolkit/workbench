import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';

import { fromEvent, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, takeUntil } from 'rxjs/operators';

// todo: implement ControlValueAccessor
@Component({
  selector: 'wb-search-field',
  templateUrl: './search-field.component.html',
  styleUrls: ['./search-field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchFieldComponent implements OnInit, OnDestroy {
  @Input() placeholder = 'Search Something';

  @Input() testId: string;

  @Output() search = new EventEmitter<string>();

  @ViewChild('searchInput', { static: true }) searchInput: ElementRef<HTMLInputElement>;

  private readonly _debounceTime = 200;

  private readonly _unsubscribe$ = new Subject<void>();

  ngOnInit(): void {
    fromEvent(this.searchInput.nativeElement, 'keyup')
      .pipe(
        takeUntil(this._unsubscribe$),
        map((event) => (event.target as HTMLInputElement).value),
        debounceTime(this._debounceTime),
        distinctUntilChanged()
      )
      .subscribe((value) => this.search.emit(value));
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }
}
