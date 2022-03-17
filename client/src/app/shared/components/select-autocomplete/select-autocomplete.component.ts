import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';

import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { matchesOptionsValidator } from '@shared/form-validators/matches-options.validator';

@Component({
  selector: 'wb-select-autocomplete',
  templateUrl: './select-autocomplete.component.html',
  styleUrls: ['./select-autocomplete.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectAutocompleteComponent implements OnInit, OnChanges {
  @Output()
  public changeSelectedLayerName: EventEmitter<string> = new EventEmitter<string>();

  @Input()
  public placeholder: string;

  @Input()
  public controlId: string;

  @Input()
  options: string[] = [];

  @Input()
  control: FormControl;

  @Input()
  testId: string;

  @Input()
  appearance = 'outline';

  @Input()
  skipOptionsValidation = false;

  public filteredOptions$: Observable<string[]>;

  @ViewChild(CdkVirtualScrollViewport, { static: true })
  public virtualScroll: CdkVirtualScrollViewport;

  public optionHeightPx = 48;
  public visibleOptionsCount = 6;
  public cdkOverlayPanelWidth = 300;

  ngOnInit(): void {
    if (!this.control) {
      throw Error('"control" is required input in SelectAutocompleteComponent');
    }

    this.filteredOptions$ = this.control.valueChanges.pipe(
      startWith(''),
      map((value) => this.filterSelectOptions(value))
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Update validators on new autocomplete options
    if (changes.options && this.controlId) {
      const fieldValidators = [Validators.required];

      if (!this.skipOptionsValidation) {
        fieldValidators.push(matchesOptionsValidator(this.options));
      }

      this.control.setValidators(fieldValidators);
    }
    this.control.updateValueAndValidity();
  }

  get bufferSizePx(): number {
    return this.optionHeightPx * this.visibleOptionsCount;
  }

  getAutocompleteHeightPx(filteredOptionsCount: number): number {
    return Math.min(filteredOptionsCount, this.visibleOptionsCount) * this.optionHeightPx;
  }

  private filterSelectOptions(value: string): string[] {
    const filterValue = value?.toLowerCase();
    return this.options.filter((option) => (option ? option.toLowerCase().includes(filterValue) : null));
  }
}
