import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { Store } from '@ngrx/store';
import { Observable, throwError } from 'rxjs';
import { catchError, filter, first, mergeMap, switchMap } from 'rxjs/operators';
import { withLatestFrom } from 'rxjs/internal/operators/withLatestFrom';

import { AuthService } from '@core/services/common/auth.service';
import { ErrorGroup, NotificationService, NotificationType } from '@core/services/common/notification.service';
import { MessagesService } from '@core/services/common/messages.service';

import { RootStoreState } from '@store/index';
import * as AuthStoreActions from '@store/auth-store/auth-store.actions';
import * as AuthStoreSelectors from '@store/auth-store/auth-store.selectors';

import { JWTAuthStatusCodeEnum } from '@shared/models/jwt';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  constructor(
    private notificationService: NotificationService,
    private messagesService: MessagesService,
    private authService: AuthService,
    private router: Router,
    private store$: Store<RootStoreState.State>
  ) {}

  intercept(request: HttpRequest<object | null>, next: HttpHandler): Observable<HttpEvent<object | null>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage;
        if (error.error instanceof ErrorEvent) {
          // client-side error
          errorMessage = `Client-side error: ${error.error.message}`;
        } else {
          // server-side error
          errorMessage = `Server side error. Code: ${error.status}\nMessage: ${error.message}`;
        }
        // Authentication error handling
        if (
          error instanceof HttpErrorResponse &&
          error.status === 422 &&
          error.error.authStatus === JWTAuthStatusCodeEnum.INVALID_JWT
        ) {
          errorMessage = `Authentication error: ${error.error.message}`;
          this.resetAuthCredentialsAndGoToLogin();
        }
        if (error instanceof HttpErrorResponse && error.status === 401) {
          if (error.error.authStatus === JWTAuthStatusCodeEnum.MISSING_JWT) {
            return throwError(error);
          }
          if (error.error.authStatus === JWTAuthStatusCodeEnum.EXPIRED_REFRESH_JWT) {
            errorMessage = `Your session has expired. Please login again`;
            this.resetAuthCredentialsAndGoToLogin();
          }
          if (error.error.authStatus === JWTAuthStatusCodeEnum.EXPIRED_ACCESS_JWT) {
            return this.handleExpiredTokenRequest(request, next);
          }
        }
        this.notificationService.add(
          this.messagesService.errorMessages.server.unrecognizedServerError,
          errorMessage,
          NotificationType.ERROR,
          ErrorGroup.SERVER
        );
        return throwError(error.error);
      })
    );
  }

  private handleExpiredTokenRequest(
    request: HttpRequest<object | null>,
    next: HttpHandler
  ): Observable<HttpEvent<object | null>> {
    const accessToken$ = this.store$.select(AuthStoreSelectors.selectAccessToken);
    const isRefreshingToken$ = this.store$.select(AuthStoreSelectors.selectIsRefreshingToken);

    return isRefreshingToken$.pipe(
      first(),
      mergeMap((isRefreshingToken) => {
        if (!isRefreshingToken) {
          this.store$.dispatch(AuthStoreActions.refreshTokenAction());
        }
        return accessToken$.pipe(
          withLatestFrom(isRefreshingToken$),
          filter(([newAccessToken, latestIsRefreshingToken]) => !latestIsRefreshingToken && !!newAccessToken),
          first(),
          switchMap(([newAccessToken]) => {
            return next.handle(this.authService.addAccessTokenHeader(request, newAccessToken));
          })
        );
      })
    );
  }

  private resetAuthCredentialsAndGoToLogin(): void {
    this.store$.dispatch(AuthStoreActions.resetCredentialsAction());
    this.router.navigate(['/login']);
  }
}
