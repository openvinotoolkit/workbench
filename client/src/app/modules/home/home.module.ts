import { NgModule } from '@angular/core';

import { SharedModule } from '@shared/shared.module';

import { HomePageComponent } from './pages/home/home-page.component';
import { AvailableModelsTableComponent } from './components/available-models-table/available-models-table.component';
import { ModelCardComponent } from './components/model-card/model-card.component';

@NgModule({
  declarations: [HomePageComponent, AvailableModelsTableComponent, ModelCardComponent],
  imports: [SharedModule],
})
export class HomeModule {}
