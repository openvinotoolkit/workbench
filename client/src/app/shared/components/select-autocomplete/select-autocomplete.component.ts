import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';

import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { MessagesService } from '@core/services/common/messages.service';

import { matchesOptionsValidator } from '@shared/form-validators/matches-options.validator';
import { Tooltip } from '@shared/components/config-form-field/config-form-field.component';

@Component({
  selector: 'wb-select-autocomplete',
  templateUrl: './select-autocomplete.component.html',
  styleUrls: ['../config-form-field/config-form-field.component.scss'],
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
  control: UntypedFormControl;

  @Input()
  testId: string;

  @Input()
  appearance = 'outline';

  @Input()
  skipOptionsValidation = false;

  // TODO: unify with AdvancedConfigField type
  @Input() label: string;
  @Input() tooltip: Tooltip;
  @Input() validators: Validators[];

  public filteredOptions$: Observable<string[]>;

  @ViewChild(CdkVirtualScrollViewport, { static: true })
  public virtualScroll: CdkVirtualScrollViewport;

  readonly optionHeightPx = 48;
  readonly visibleOptionsCount = 6;
  readonly cdkOverlayPanelWidth = 300;

  constructor(public tooltipService: MessagesService) {}

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

  get isRequired(): boolean {
    return this.validators?.includes(Validators.required);
  }

  get shouldDisplayErrorMessage(): boolean {
    return this.control?.invalid && this.control?.touched;
  }

  get getError(): string {
    if (this.control.hasError('required')) {
      return 'This field is required';
    }
  }
}
