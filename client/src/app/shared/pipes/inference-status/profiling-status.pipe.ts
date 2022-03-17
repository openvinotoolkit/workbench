import { Pipe, PipeTransform } from '@angular/core';

import { Observable, of } from 'rxjs';

import { ProjectStatus } from '@store/project-store/project.model';

import { IProfilingPipeline } from '@shared/models/pipelines/profiling-pipeline';
import { profilingStatus$ } from '@shared/pipes/inference-status/smooth-inference-status';
import { IInt8CalibrationPipeline } from '@shared/models/pipelines/int8-calibration-pipeline';

@Pipe({
  name: 'profilingStatus',
})
export class ProfilingStatusPipe implements PipeTransform {
  transform(value: IProfilingPipeline | IInt8CalibrationPipeline): Observable<ProjectStatus> {
    return value ? profilingStatus$(value) : of(null);
  }
}
