import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'multiLineText',
})
export class MultiLineTextPipe implements PipeTransform {
  transform(text: string): string {
    const table = {
      '<': 'lt',
      '>': 'gt',
      '"': 'quot',
      "'": 'apos',
      '&': 'amp',
    };
    return text
      ? text
          .toString()
          .replace(/[<>"'&]/g, function(chr) {
            return '&' + table[chr] + ';';
          })
          .replace(/\n/g, '<br/>')
      : '';
  }
}
