import { Injectable } from '@angular/core';
import { HttpClient, HttpRequest } from '@angular/common/http';

import { Observable } from 'rxjs';
import * as jwtDecode from 'jwt-decode';
import { split, find, replace } from 'lodash';

import { ConnectionService } from '@core/services/api/connection.service';

import { defaultUsername } from '@shared/constants';

export interface LoginResponse {
  accessToken: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly authApiEndpoints = {
    login: `${this.connectionService.prefix}/auth/login`,
    refresh: `${this.connectionService.prefix}/auth/refresh`,
    logout: `${this.connectionService.prefix}/auth/logout`,
  };

  constructor(private connectionService: ConnectionService, private http: HttpClient) {}

  public loginWithToken$(loginToken: string, viaUrl: boolean): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.authApiEndpoints.login, {
      token: loginToken,
      username: defaultUsername,
      isUrlLogin: viaUrl,
    });
  }

  public refreshToken$(): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.authApiEndpoints.refresh, null);
  }

  public logOut$(): Observable<{ logout: boolean }> {
    return this.http.delete<{ logout: boolean }>(this.authApiEndpoints.logout);
  }

  public getJTIfromToken(accessToken: string) {
    const payload = jwtDecode(accessToken);
    return payload['jti'];
  }

  public addAccessTokenHeader(request: HttpRequest<object>, token: string): HttpRequest<object> {
    const authHeaderName = 'Authorization';
    const headers = this.isRefreshRequest(request)
      ? request.headers.delete(authHeaderName)
      : request.headers.set(authHeaderName, `Bearer ${token}`);
    return request.clone({
      headers,
    });
  }

  public isRefreshRequest(request: HttpRequest<object>): boolean {
    return request.url === this.authApiEndpoints.refresh;
  }

  public addCSRFTokenHeader(request: HttpRequest<object>): HttpRequest<object> {
    return request.clone({
      headers: request.headers.set('X-CSRF-TOKEN', this.getCSRFTokenFromCookie()),
    });
  }

  private getCSRFTokenFromCookie(): string {
    const { cookie } = document;
    const csrfCookieName = 'csrf_refresh_token';
    const csrfCookie = find<string>(split(cookie, ';'), (cookieParam) => cookieParam.includes(csrfCookieName));
    return replace(csrfCookie, `${csrfCookieName}=`, '').trim();
  }
}
