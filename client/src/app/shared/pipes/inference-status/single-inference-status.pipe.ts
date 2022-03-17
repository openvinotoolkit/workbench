import { Pipe, PipeTransform } from '@angular/core';

import { Observable, of } from 'rxjs';

import { IInferenceResult } from '@store/inference-history-store/inference-history.model';
import { ProjectStatus } from '@store/project-store/project.model';

import { singleInferenceStatus$ } from '@shared/pipes/inference-status/smooth-inference-status';

@Pipe({
  name: 'singleInferenceStatus',
})
export class SingleInferenceStatusPipe implements PipeTransform {
  transform(value: IInferenceResult): Observable<ProjectStatus> {
    return value ? singleInferenceStatus$(value) : of(null);
  }
}
