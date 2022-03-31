import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'callFunction',
})
export class CallFunctionPipe implements PipeTransform {
  transform(value: unknown, transform?: (value: unknown, ...args: unknown[]) => unknown, ...args: unknown[]): unknown {
    if (!transform) {
      return value;
    }

    return transform(value, args);
  }
}
