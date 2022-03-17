import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '@shared/shared.module';

import { AddRemoteTargetComponent } from './pages/add-remote-target/add-remote-target.component';
import { TargetMachinesComponent } from './pages/target-machines/target-machines.component';
import { TargetMachinesRoutingModule } from './target-machines-routing.module';
import { TargetMachinesTableComponent } from './components/target-machines-table/target-machines-table.component';
import { PipelineStagesComponent } from './components/pipeline-stages/pipeline-stages.component';
import { TargetMachineDetailsComponent } from './components/target-machine-details/target-machine-details.component';
import { PipelineStageStatusComponent } from './components/pipeline-stage-status/pipeline-stage-status.component';
import { TargetMachineFormComponent } from './components/target-machine-form/target-machine-form.component';
import { EditRemoteTargetComponent } from './pages/edit-remote-target/edit-remote-target.component';
import { StageTroubleshootComponent } from './components/pipeline-stages/stage-troubleshoot/stage-troubleshoot.component';
import { PipelineStageDetailsComponent } from './components/pipeline-stage-details/pipeline-stage-details.component';

@NgModule({
  declarations: [
    AddRemoteTargetComponent,
    TargetMachinesComponent,
    TargetMachinesTableComponent,
    PipelineStagesComponent,
    PipelineStageStatusComponent,
    TargetMachineDetailsComponent,
    TargetMachineFormComponent,
    EditRemoteTargetComponent,
    StageTroubleshootComponent,
    PipelineStageDetailsComponent,
  ],
  imports: [CommonModule, SharedModule, TargetMachinesRoutingModule],
})
export class TargetMachinesModule {}
