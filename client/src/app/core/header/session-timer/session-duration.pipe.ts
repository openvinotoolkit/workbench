import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sessionDuration',
})
export class SessionDurationPipe implements PipeTransform {
  transform(value: number): string | null {
    if (!value) {
      return null;
    }

    const durationInSeconds = Math.ceil(value / 1000);
    const seconds = `${durationInSeconds % 60}`.padStart(2, '0');
    const minutes = `${Math.floor(durationInSeconds / 60) % 60}`.padStart(2, '0');
    const hours = `${Math.floor(durationInSeconds / (60 * 60))}`.padStart(2, '0');

    return `${hours}:${minutes}:${seconds}`;
  }
}
