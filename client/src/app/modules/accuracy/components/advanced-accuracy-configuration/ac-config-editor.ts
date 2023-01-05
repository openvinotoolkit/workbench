import { UntypedFormControl, Validators } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';

import * as jsyaml from 'js-yaml';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AccuracyRestService } from '@core/services/api/rest/accuracy.service';

import {
  IAccuracyValidationError,
  IRawAccuracyConfig,
} from '@store/advanced-accuracy-store/advanced-accuracy-store.models';

import { ICodeEditor, ICodeEditorError } from './code-editor/code-editor';
import { ACConfigValidators } from './ac-config-validators';

const getCodeEditorErrors = (errors: IAccuracyValidationError[]) =>
  errors
    .filter((v) => !!v.mark)
    .map((error) => ({
      startLineNumber: error.mark.start.line,
      startColumn: error.mark.start.column,
      endLineNumber: error.mark.end.line,
      endColumn: error.mark.end.column,
      message: error.message,
    }));

export interface IACConfigControlErrors {
  required: boolean;
  yaml: ICodeEditorError;
  schema: IAccuracyValidationError[];
}

/**
 * Connects ICodeEditor with FormControl
 * Adds appropriate validators
 */
export class ACConfigEditor {
  private _codeEditor: ICodeEditor;

  readonly control = new UntypedFormControl(null, [Validators.required, ACConfigValidators.yamlSyntax]);

  private _unsubscribe$ = new Subject<void>();

  initialize(
    codeEditor: ICodeEditor,
    projectId: number,
    accuracyRestService: AccuracyRestService,
    cdr: ChangeDetectorRef
  ): void {
    this._codeEditor = codeEditor;

    this.control.setAsyncValidators([
      ACConfigValidators.acSchema(projectId, accuracyRestService, cdr, this._unsubscribe$),
    ]);

    this._codeEditor.valueChanges$
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe((value) => this.control.setValue(value));

    this.control.statusChanges
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe(() => this._handleConfigErrors(this.control.errors as IACConfigControlErrors));
  }

  private _handleConfigErrors(errors: IACConfigControlErrors): void {
    if (!errors) {
      this._codeEditor.setErrors([]);
      return;
    }

    const editorErrors: ICodeEditorError[] = [];
    if (errors.yaml) {
      editorErrors.push(errors.yaml);
    }
    if (errors.schema?.length) {
      editorErrors.push(...getCodeEditorErrors(errors.schema));
    }

    this._codeEditor.setErrors(editorErrors);
  }

  setValue(value: IRawAccuracyConfig): void {
    if (!this._codeEditor) {
      return;
    }

    if (!value) {
      this._codeEditor.setValue('');
      return;
    }

    // ensure right order
    const { name, launchers, datasets } = value.models[0];
    const textValue = jsyaml.dump({ name, launchers, datasets });

    this._codeEditor.setValue(textValue);
  }

  getValue(): IRawAccuracyConfig {
    return {
      models: [jsyaml.load(this.control.value)],
    };
  }

  destroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
    this._codeEditor.destroy();
    this._codeEditor = null;
  }
}
