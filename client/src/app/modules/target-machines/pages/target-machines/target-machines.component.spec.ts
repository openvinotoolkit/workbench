import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { StoreModule } from '@ngrx/store';
import { Angulartics2Module } from 'angulartics2';

import { RootStoreState } from '@store';

import { SharedModule } from '@shared/shared.module';

import { TargetMachinesComponent } from './target-machines.component';
import { TargetMachineDetailsComponent } from '../../components/target-machine-details/target-machine-details.component';
import { TargetMachinesTableComponent } from '../../components/target-machines-table/target-machines-table.component';
import { PipelineStagesComponent } from '../../components/pipeline-stages/pipeline-stages.component';
import { PipelineStageStatusComponent } from '../../components/pipeline-stage-status/pipeline-stage-status.component';
import { PipelineStageDetailsComponent } from '../../components/pipeline-stage-details/pipeline-stage-details.component';
import { StageTroubleshootComponent } from '../../components/pipeline-stages/stage-troubleshoot/stage-troubleshoot.component';

describe('TargetMachinesComponent', () => {
  let component: TargetMachinesComponent;
  let fixture: ComponentFixture<TargetMachinesComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [
          Angulartics2Module.forRoot(),
          RouterTestingModule,
          CommonModule,
          SharedModule,
          BrowserAnimationsModule,
          RouterTestingModule,
          StoreModule.forRoot({
            ...RootStoreState.reducers,
          }),
        ],
        declarations: [
          TargetMachinesComponent,
          TargetMachineDetailsComponent,
          TargetMachinesTableComponent,
          PipelineStagesComponent,
          PipelineStageStatusComponent,
          PipelineStageDetailsComponent,
          StageTroubleshootComponent,
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(TargetMachinesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
