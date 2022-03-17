import { Pipe, PipeTransform } from '@angular/core';
import { formatNumber } from '@angular/common';

export function formatSize(value: number, unit: string = 'Mb', minSize: number = 1): string {
  if (!value) {
    return 'N/A';
  }
  if (value < minSize) {
    return `< ${minSize} ${unit}`;
  }
  const formattedSize = formatNumber(value, 'en-US', '1.0-0');
  return `${formattedSize} ${unit}`;
}

export function toLowerBoundedString(value: number, fractionDigits = 2): string {
  const fractionNumber = 1 / 10 ** fractionDigits;
  return value < fractionNumber ? `< ${fractionNumber.toFixed(fractionDigits)}` : value.toFixed(fractionDigits);
}

@Pipe({
  name: 'formatNumber',
})
export class FormatNumberPipe implements PipeTransform {
  transform(value: number | string): string {
    const num = Number(value);

    if (isNaN(num)) {
      return 'N/A';
    }

    if (num !== 0 && Math.abs(num) < 0.01) {
      return num > 0 ? '< 0.01' : '> -0.01';
    } else {
      return this.format(num.toFixed(2));
    }
  }

  private format(num: string): string {
    const parts = num.split('.');

    parts[0] = parts[0].replace(/(\d)(?=(\d{3})+$)/g, '$1 ');

    return parts.join('.');
  }
}
