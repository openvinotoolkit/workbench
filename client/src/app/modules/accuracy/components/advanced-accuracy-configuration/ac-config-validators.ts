import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';

import { Observable, Subject, timer } from 'rxjs';
import { finalize, map, switchMap, takeUntil } from 'rxjs/operators';
import * as jsyaml from 'js-yaml';

import { AccuracyRestService } from '@core/services/api/rest/accuracy.service';

export class ACConfigValidators {
  static yamlSyntax(control: AbstractControl): ValidationErrors {
    try {
      jsyaml.load(control.value);
    } catch (e) {
      return {
        yaml: {
          startLineNumber: e.mark.line + 1,
          startColumn: 0,
          endLineNumber: e.mark.line + 1,
          endColumn: e.mark.column + 1,
          message: e.message,
        },
      };
    }

    return null;
  }

  static acSchema(
    projectId: number,
    accuracyRestService: AccuracyRestService,
    cdr: ChangeDetectorRef,
    unsubscribe$: Subject<void>
  ): AsyncValidatorFn {
    return (control): Observable<ValidationErrors> =>
      timer(500).pipe(
        switchMap(() => accuracyRestService.validateRawConfig$(projectId, control.value)),
        map(({ valid, errors }) => (valid ? null : { schema: errors })),
        finalize(() => cdr.markForCheck()),
        takeUntil(unsubscribe$)
      );
  }
}
