import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanDeactivate, RouterStateSnapshot, UrlTree } from '@angular/router';

import { Observable } from 'rxjs';

import { ImportPageComponent } from '../../modules/model-manager/pages/import-page/import-page.component';
import { EditPageComponent } from '../../modules/model-manager/pages/edit-page/edit-page.component';

@Injectable({
  providedIn: 'root',
})
export class LeaveModelPageGuard implements CanDeactivate<ImportPageComponent | EditPageComponent> {
  canDeactivate(
    component: ImportPageComponent | EditPageComponent,
    currentRoute: ActivatedRouteSnapshot,
    currentState: RouterStateSnapshot,
    nextState?: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (component.importPage.redirectAllowed || !component.importPage.model) {
      return true;
    }
    return component.importPage.handlePageLeave();
  }
}
