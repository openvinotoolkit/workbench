import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ModelRouteGuard } from '@core/guards/model-route.guard';

import { ComparePageComponent } from './pages/compare-page/compare-page.component';
import { DashboardPageComponent } from './pages/dashboard-page/dashboard-page.component';
import { InferenceConfigurationPageComponent } from './pages/inference-configuration-page/inference-configuration-page.component';

const dashboardRoutes: Routes = [
  {
    path: ':modelId/projects/:projectId',
    component: DashboardPageComponent,
    canActivate: [ModelRouteGuard],
  },
  {
    path: ':modelId/projects/:projectId/inference/configuration',
    component: InferenceConfigurationPageComponent,
    canActivate: [ModelRouteGuard],
  },
  {
    path: ':modelId/compare',
    component: ComparePageComponent,
    canActivate: [ModelRouteGuard],
  },
  { path: '', redirectTo: '/', pathMatch: 'full' },
  {
    path: '**',
    redirectTo: '/',
  },
];

@NgModule({
  imports: [RouterModule.forChild(dashboardRoutes)],
  exports: [RouterModule],
  declarations: [],
})
export class DashboardRoutingModule {}
