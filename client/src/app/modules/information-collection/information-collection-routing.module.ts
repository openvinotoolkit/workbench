import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { InformationCollectionComponent } from './pages/information-collection/information-collection.component';

const informationCollectionRoutes: Routes = [
  {
    path: '',
    component: InformationCollectionComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(informationCollectionRoutes)],
  exports: [RouterModule],
  declarations: [],
})
export class InformationCollectionRoutingModule {}
