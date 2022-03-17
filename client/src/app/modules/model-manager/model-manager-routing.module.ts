import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LeaveModelPageGuard } from '@core/guards/leave-model-page.guard';
import { ModelRouteGuard } from '@core/guards/model-route.guard';

import { ImportPageComponent } from './pages/import-page/import-page.component';
import { EditPageComponent } from './pages/edit-page/edit-page.component';

const modelManagerRoutes: Routes = [
  {
    path: 'import',
    component: ImportPageComponent,
    canDeactivate: [LeaveModelPageGuard],
  },
  {
    path: ':modelId/edit',
    component: EditPageComponent,
    canActivate: [ModelRouteGuard],
  },
  {
    path: '**',
    redirectTo: '/',
  },
];

@NgModule({
  imports: [RouterModule.forChild(modelManagerRoutes)],
  exports: [RouterModule],
})
export class ModelManagerRoutingModule {}
