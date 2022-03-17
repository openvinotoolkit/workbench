import { Injectable } from '@angular/core';

import { BehaviorSubject, merge, Subject } from 'rxjs';
import { delay } from 'rxjs/operators';

/**
 * Clear control of inpainting canvas is placed outside of canvas component.
 * Component interaction with @Input @Output looks complicated and error-prone
 * Service used to simplify interaction
 */
@Injectable()
export class PaintingCanvasManagerService {
  available$ = new BehaviorSubject<boolean>(false);
  clearDisabled$ = new BehaviorSubject<boolean>(true);
  clear$ = new Subject();
  change$ = merge(this.available$, this.clearDisabled$, this.clear$).pipe(delay(0));
}
