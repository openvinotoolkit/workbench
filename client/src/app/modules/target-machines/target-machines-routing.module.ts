import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';

import { TargetMachinesRouteGuard } from '@core/guards/target-machines-route.guard';

import { TargetMachinesComponent } from './pages/target-machines/target-machines.component';
import { AddRemoteTargetComponent } from './pages/add-remote-target/add-remote-target.component';
import { EditRemoteTargetComponent } from './pages/edit-remote-target/edit-remote-target.component';

const targetMachinesRoutes: Routes = [
  {
    path: '',
    component: TargetMachinesComponent,
    canActivate: [TargetMachinesRouteGuard],
  },
  {
    path: 'add',
    component: AddRemoteTargetComponent,
    canActivate: [TargetMachinesRouteGuard],
  },
  {
    path: ':targetId/edit',
    component: EditRemoteTargetComponent,
    canActivate: [TargetMachinesRouteGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(targetMachinesRoutes)],
  exports: [RouterModule],
  declarations: [],
})
export class TargetMachinesRoutingModule {}
