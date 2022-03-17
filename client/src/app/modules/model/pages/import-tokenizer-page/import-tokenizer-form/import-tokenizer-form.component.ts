import { ChangeDetectionStrategy, Component, EventEmitter, OnDestroy, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { Subject } from 'rxjs';
import { delay, startWith, takeUntil } from 'rxjs/operators';

import { TokenizerType } from '@shared/models/tokenizer/tokenizer';

import { fields } from './form-fields';
import { ITokenizerDTO } from '../tokenizer-dto.model';

@Component({
  selector: 'wb-import-tokenizer-form',
  templateUrl: './import-tokenizer-form.component.html',
  styleUrls: ['./import-tokenizer-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportTokenizerFormComponent implements OnDestroy {
  @Output() tokenizerChange = new EventEmitter<ITokenizerDTO>();

  readonly fields = fields;

  readonly form = new FormGroup({
    [fields.type.name]: new FormControl(fields.type.value, fields.type.validators),
    [fields.vocabFile.name]: new FormControl(null, [Validators.required]),
    [fields.lowerCase.name]: new FormControl(fields.lowerCase.value, [Validators.required]),
    [fields.name.name]: new FormControl(fields.name.value, fields.name.validators),
  });

  private _unsubscribe$ = new Subject<void>();

  constructor() {
    // add/remove merges file control
    this.form.controls[fields.type.name].valueChanges
      .pipe(takeUntil(this._unsubscribe$), startWith(this.form.value.type as TokenizerType))
      .subscribe((type: TokenizerType) => {
        if (type === TokenizerType.WORDPIECE) {
          this.form.removeControl(fields.mergesFile.name);
        }
        if (type === TokenizerType.BPE) {
          this.form.addControl(fields.mergesFile.name, new FormControl(null, [Validators.required]));
        }
      });

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe$), delay(0)).subscribe(() => this.emitChange());
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  onVocabFileChange(file: File): void {
    if (!file) {
      return;
    }

    this.form.patchValue({
      [fields.vocabFile.name]: file,
      [fields.name.name]: file.name.split('.')[0],
    });
    const control = this.form.get(fields.name.name);
    control.markAsTouched();
    control.updateValueAndValidity();
  }

  onMergesFileChange(file: File): void {
    if (!file) {
      return;
    }

    this.form.patchValue({
      [fields.mergesFile.name]: file,
    });
  }

  emitChange(): void {
    if (!this.form.valid) {
      return;
    }

    const { type, name, lowerCase, vocabFile, mergesFile } = this.form.value;
    this.tokenizerChange.emit({
      type,
      name,
      lowerCase,
      vocabFile,
      mergesFile,
    });
  }
}
