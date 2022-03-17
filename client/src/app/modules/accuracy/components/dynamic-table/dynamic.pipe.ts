import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dynamic',
})
export class DynamicPipe implements PipeTransform {
  transform(value: unknown, transform?: (value: unknown, ...args: unknown[]) => unknown, ...args: unknown[]): unknown {
    if (!transform) {
      return value;
    }

    return transform(value, args);
  }
}
