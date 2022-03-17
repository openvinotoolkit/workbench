import { Location } from '@angular/common';

export class RouterUtils {
  static deleteQueryParamsFromUrl(location: Location): void {
    const [pathWithoutQueryParams] = location.path().split('?');
    location.replaceState(pathWithoutQueryParams);
  }
}
