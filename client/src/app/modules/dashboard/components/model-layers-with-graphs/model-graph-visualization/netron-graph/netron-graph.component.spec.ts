import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { Angulartics2Module } from 'angulartics2';

import { GoogleAnalyticsService } from '@core/services/common/google-analytics.service';

import { ModelGraphType } from '@store/model-store/model.model';

import { SharedModule } from '@shared/shared.module';

import { NetronGraphComponent } from './netron-graph.component';
import { ModelGraphVisualizationService } from '../model-graph-visualization.service';

class MockNetronGraphRenderService {
  notifyViewIsAvailable(): void {}

  isRendering(): boolean {
    return false;
  }

  hasRenderingError(): boolean {
    return false;
  }

  getElementIdWithGraphTypeSuffix(): string {
    return '';
  }

  isLayerAvailable(): boolean {
    return false;
  }
}

describe('NetronGraphComponent', () => {
  let component: NetronGraphComponent;
  let fixture: ComponentFixture<NetronGraphComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [
          SharedModule,
          Angulartics2Module.forRoot(),
          RouterTestingModule.withRoutes([]),
          BrowserAnimationsModule,
        ],
        providers: [
          GoogleAnalyticsService,
          {
            provide: ModelGraphVisualizationService,
            useClass: MockNetronGraphRenderService,
          },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(NetronGraphComponent);
    component = fixture.componentInstance;
    component.graphType = ModelGraphType.ORIGINAL;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
