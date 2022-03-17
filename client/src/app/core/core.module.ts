import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';

import { Angulartics2Module } from 'angulartics2';

import { environment } from '@env';

import { AuthInterceptor } from '@core/interceptors/auth.interceptor';
import { UserPanelModule } from '@core/user-panel/user-panel.module';
import { AnalyticsPopupModule } from '@core/analytics-popup/analytics-popup.module';
import { NotificationModule } from '@core/notification/notification.module';

import { RootStoreModule } from '@store';

import { SharedModule } from '@shared/shared.module';

import { HttpErrorInterceptor } from './interceptors/http-error.interceptor';
import { PopupModule } from './popup/popup.module';
import { HomeModule } from '../modules/home/home.module';
import { HeaderModule } from './header/header.module';

@NgModule({
  imports: [
    CommonModule,
    BrowserAnimationsModule,
    HttpClientModule,
    RootStoreModule,
    HeaderModule,
    AnalyticsPopupModule,
    PopupModule,
    HomeModule,
    UserPanelModule,
    SharedModule,
    NotificationModule,
    Angulartics2Module.forRoot({
      pageTracking: {
        clearQueryParams: true,
        clearHash: true,
      },
    }),
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpErrorInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
  ],
  exports: [
    // Export header module as header.component is used in app.component
    HeaderModule,
    SharedModule,
    UserPanelModule,
    NotificationModule,
  ],
})
export class CoreModule {}
