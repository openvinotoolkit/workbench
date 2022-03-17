import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from '@core/guards/auth.guard';

import { HomePageComponent } from './modules/home/pages/home/home-page.component';

const appRoutes: Routes = [
  {
    path: '',
    component: HomePageComponent,
    canActivate: [AuthGuard],
    pathMatch: 'full',
  },
  {
    path: 'models',
    canActivate: [AuthGuard],
    loadChildren: () => import('app/modules/model/model.module').then((m) => m.ModelModule),
  },
  {
    path: 'projects',
    canActivate: [AuthGuard],
    loadChildren: () => import('app/modules/project/project.module').then((m) => m.ProjectModule),
  },
  {
    path: 'target-machines',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('app/modules/target-machines/target-machines.module').then((m) => m.TargetMachinesModule),
  },
  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadChildren: () => import('app/modules/dashboard/dashboard.module').then((m) => m.DashboardModule),
  },
  {
    path: 'model-manager',
    canActivate: [AuthGuard],
    loadChildren: () => import('app/modules/model-manager/model-manager.module').then((m) => m.ModelManagerModule),
  },
  {
    path: 'dataset-manager',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('app/modules/dataset-manager/dataset-manager.module').then((m) => m.DatasetManagerModule),
  },
  {
    path: 'login',
    loadChildren: () => import('app/modules/login/login.module').then((m) => m.LoginModule),
  },
  {
    path: 'information-collection',
    loadChildren: () =>
      import('app/modules/information-collection/information-collection.module').then(
        (m) => m.InformationCollectionModule
      ),
  },
  {
    path: '**',
    redirectTo: '/',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(appRoutes)],
  exports: [RouterModule],
  declarations: [],
})
export class AppRoutingModule {}
