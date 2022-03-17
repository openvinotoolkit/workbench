import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '@shared/shared.module';

import { InformationCollectionComponent } from './pages/information-collection/information-collection.component';
import { InformationCollectionRoutingModule } from './information-collection-routing.module';

@NgModule({
  declarations: [InformationCollectionComponent],
  imports: [CommonModule, SharedModule, CommonModule, InformationCollectionRoutingModule],
})
export class InformationCollectionModule {}
