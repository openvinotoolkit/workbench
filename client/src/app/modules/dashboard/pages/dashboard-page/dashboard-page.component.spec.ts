import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { StoreModule } from '@ngrx/store';
import { Angulartics2Module } from 'angulartics2';

import { GoogleAnalyticsService } from '@core/services/common/google-analytics.service';

import { RootStoreState } from '@store';
import { ProjectConverterService } from '@store/project-store/project-converter.service';

import { SharedModule } from '@shared/shared.module';

import { DashboardPageComponent } from './dashboard-page.component';
import { BarChartComponent } from '../../components/bar-chart/bar-chart.component';
import { BenchmarkChartComponent } from '../../components/benchmark-chart/benchmark-chart.component';
import { InferenceHistoryComponent } from '../../components/inference-history/inference-history.component';
import { LayersTableModule } from '../../components/model-layers-with-graphs/layers-table/layers-table.module';
import { DeploymentManagerComponent } from '../../components/deployment-manager/deployment-manager.component';
import { ProfileConfigurationComponent } from '../../components/profile-configuration/profile-configuration.component';
import { AccuracyModule } from '../../../accuracy/accuracy.module';

describe('DashboardPageComponent', () => {
  let component: DashboardPageComponent;
  let fixture: ComponentFixture<DashboardPageComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [
          BrowserAnimationsModule,
          RouterTestingModule,
          SharedModule,
          LayersTableModule,
          Angulartics2Module.forRoot(),
          StoreModule.forRoot({
            ...RootStoreState.reducers,
          }),
          AccuracyModule,
        ],
        declarations: [
          DashboardPageComponent,
          BarChartComponent,
          BenchmarkChartComponent,
          InferenceHistoryComponent,
          DeploymentManagerComponent,
          ProfileConfigurationComponent,
        ],
        providers: [GoogleAnalyticsService, ProjectConverterService],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
