import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';

import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { ModelsService } from '@core/services/api/rest/models.service';

import { RouterStoreSelectors } from '@store/router-store';
import { RootStoreState } from '@store/index';

@Injectable({
  providedIn: 'root',
})
export class ModelRouteGuard implements CanActivate {
  constructor(
    private store$: Store<RootStoreState.State>,
    private router: Router,
    private modelsService: ModelsService
  ) {}
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.store$.select(RouterStoreSelectors.selectParamModelId).pipe(
      switchMap((id) => this.modelsService.getModel$(id)),
      catchError(() => of(null)),
      map((model) => {
        if (!model) {
          this.router.navigate(['/']);
        }
        return true;
      })
    );
  }
}
