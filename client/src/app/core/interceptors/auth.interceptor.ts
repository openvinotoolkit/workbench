import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';

import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { first, mergeMap } from 'rxjs/operators';

import { AuthService } from '@core/services/common/auth.service';

import { RootStoreState } from '@store/index';
import * as AuthStoreSelectors from '@store/auth-store/auth-store.selectors';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private store$: Store<RootStoreState.State>, private authService: AuthService) {}

  intercept(request: HttpRequest<object>, next: HttpHandler): Observable<HttpEvent<object>> {
    return this.store$.select<string>(AuthStoreSelectors.selectAccessToken).pipe(
      first(),
      mergeMap((accessToken) => {
        if (accessToken) {
          request = this.authService.addAccessTokenHeader(request, accessToken);
        }
        if (this.authService.isRefreshRequest(request)) {
          request = this.authService.addCSRFTokenHeader(request);
        }
        return next.handle(request);
      })
    );
  }
}
