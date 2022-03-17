import { Pipe, PipeTransform } from '@angular/core';

import { Dictionary } from '@ngrx/entity';
import { startCase } from 'lodash';

// TODO consider moving to shared
@Pipe({
  name: 'parameterName',
})
export class ParameterNamePipe implements PipeTransform {
  private keyToNameMap: Dictionary<string> = {
    execOrder: 'Execution Order',
    execTimeMcs: 'Execution Time, ms',
  };

  transform(value: string): string {
    return this.keyToNameMap[value] || startCase(value);
  }
}
