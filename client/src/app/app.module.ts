import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { CoreModule } from '@core/core.module';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, CoreModule, AppRoutingModule],
  bootstrap: [AppComponent],
})
export class AppModule {}
