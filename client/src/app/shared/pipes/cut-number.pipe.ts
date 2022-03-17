import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'cutNumber',
})
export class CutNumberPipe implements PipeTransform {
  transform(value: number, end: number): string {
    return value.toString().slice(0, end);
  }
}
