import { Injectable } from '@angular/core';

import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PrecisionAnalysisAdvisorService {
  hasAdvices$ = new Subject<boolean>();

  setHasAdvicesAs(value: boolean): void {
    this.hasAdvices$.next(value);
  }
}
