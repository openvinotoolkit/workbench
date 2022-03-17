import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ProjectRouteGuard } from '@core/guards/project-route.guard';

import { CreateProjectPageComponent } from './pages/create-project-page/create-project-page.component';
import { EditAccuracyComponent } from './pages/edit-accuracy/edit-accuracy.component';
import { CalibrationConfigurationComponent } from './pages/calibration-configuration/calibration-configuration.component';

const projectRoutes: Routes = [
  {
    path: '',
    redirectTo: 'create',
    pathMatch: 'full',
  },
  {
    path: 'create',
    component: CreateProjectPageComponent,
  },
  {
    path: 'edit-accuracy/models/:modelId/projects/:projectId',
    component: EditAccuracyComponent,
    canActivate: [ProjectRouteGuard],
  },
  {
    path: 'edit-calibration/:projectId',
    component: CalibrationConfigurationComponent,
    canActivate: [ProjectRouteGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(projectRoutes)],
  exports: [RouterModule],
  declarations: [],
})
export class ProjectRoutingModule {}
