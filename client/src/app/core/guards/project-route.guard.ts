import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';

import { Observable, of } from 'rxjs';
import { Store } from '@ngrx/store';
import { catchError, map, switchMap } from 'rxjs/operators';

import { ProjectsRestService } from '@core/services/api/rest/projects-rest.service';

import { RootStoreState, RouterStoreSelectors } from '@store/index';

@Injectable({
  providedIn: 'root',
})
export class ProjectRouteGuard implements CanActivate {
  constructor(
    private store$: Store<RootStoreState.State>,
    private router: Router,
    private projectsService: ProjectsRestService
  ) {}
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.store$.select(RouterStoreSelectors.selectParamProjectId).pipe(
      switchMap((id) => this.projectsService.getProjectInfo$(id)),
      catchError(() => of(null)),
      map((project) => {
        if (!project) {
          this.router.navigate(['/']);
        }
        return true;
      })
    );
  }
}
