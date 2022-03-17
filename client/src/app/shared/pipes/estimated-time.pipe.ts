import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'estimatedTime',
})
export class EstimatedTimePipe implements PipeTransform {
  private static _pluralize(word: string, count: number): string {
    return `${word}${count === 1 ? '' : 's'}`;
  }

  transform(value: number): string {
    if (!value) {
      return null;
    }
    const durationInSeconds = Math.ceil(value / 1000);
    const timeSegments = [{ metric: 'second', duration: durationInSeconds % 60 }];
    if (durationInSeconds >= 60) {
      timeSegments.push({ metric: 'minute', duration: Math.floor(durationInSeconds / 60) % 60 });
    }
    if (durationInSeconds >= 60 * 60) {
      timeSegments.push({ metric: 'hour', duration: Math.floor(durationInSeconds / (60 * 60)) });
    }
    return timeSegments
      .reverse()
      .map(({ metric, duration }) => `${duration} ${EstimatedTimePipe._pluralize(metric, duration)}`)
      .join(' : ');
  }
}
