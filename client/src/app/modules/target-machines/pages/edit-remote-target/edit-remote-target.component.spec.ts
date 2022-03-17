import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { StoreModule } from '@ngrx/store';
import { Angulartics2Module } from 'angulartics2';

import { RootStoreState } from '@store';

import { SharedModule } from '@shared/shared.module';

import { EditRemoteTargetComponent } from './edit-remote-target.component';
import { PipelineStagesComponent } from '../../components/pipeline-stages/pipeline-stages.component';
import { TargetMachineFormComponent } from '../../components/target-machine-form/target-machine-form.component';
import { PipelineStageStatusComponent } from '../../components/pipeline-stage-status/pipeline-stage-status.component';
import { PipelineStageDetailsComponent } from '../../components/pipeline-stage-details/pipeline-stage-details.component';
import { StageTroubleshootComponent } from '../../components/pipeline-stages/stage-troubleshoot/stage-troubleshoot.component';

describe('EditRemoteTargetComponent', () => {
  let component: EditRemoteTargetComponent;
  let fixture: ComponentFixture<EditRemoteTargetComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [
          Angulartics2Module.forRoot(),
          CommonModule,
          SharedModule,
          RouterTestingModule,
          BrowserAnimationsModule,
          StoreModule.forRoot({
            ...RootStoreState.reducers,
          }),
        ],
        declarations: [
          EditRemoteTargetComponent,
          PipelineStagesComponent,
          TargetMachineFormComponent,
          PipelineStageStatusComponent,
          PipelineStageDetailsComponent,
          StageTroubleshootComponent,
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(EditRemoteTargetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
