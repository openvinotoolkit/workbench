import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';

import { isNil } from 'lodash';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { filter, map } from 'rxjs/operators';

import { GlobalsStoreSelectors, RootStoreState } from '@store/index';

@Injectable({
  providedIn: 'root',
})
export class TargetMachinesRouteGuard implements CanActivate {
  constructor(private store$: Store<RootStoreState.State>, private router: Router) {}
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.store$.select(GlobalsStoreSelectors.selectIsDevCloudMode).pipe(
      // Wait for boolean flag from '/sync' response indicating startup in DevCloud and
      // prevent navigation to target machines pages
      filter((isDevCloudMode) => !isNil(isDevCloudMode)),
      map((isDevCloudMode) => {
        if (isDevCloudMode) {
          this.router.navigate(['/projects/create']);
          return false;
        }
        return true;
      })
    );
  }
}
