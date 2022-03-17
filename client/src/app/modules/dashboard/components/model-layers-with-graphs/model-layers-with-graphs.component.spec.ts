import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { Angulartics2Module } from 'angulartics2';

import { ModelPrecisionEnum } from '@store/model-store/model.model';
import { mockModelItemList } from '@store/model-store/model.reducer.spec';

import { ModelLayersWithGraphsComponent } from './model-layers-with-graphs.component';
import { ModelLayersWithGraphsModule } from './model-layers-with-graphs.module';

describe('ModelLayersWithGraphsComponent', () => {
  let component: ModelLayersWithGraphsComponent;
  let fixture: ComponentFixture<ModelLayersWithGraphsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        ModelLayersWithGraphsModule,
        Angulartics2Module.forRoot(),
        RouterTestingModule,
      ],
      declarations: [ModelLayersWithGraphsComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModelLayersWithGraphsComponent);
    component = fixture.componentInstance;
    component.inferenceResult = {
      jobId: null,
      inferenceResultId: null,
      execInfo: null,
      runtimeRepresentation: [
        {
          layerName: '',
          layerType: '',
          execTime: [],
          runtimePrecision: ModelPrecisionEnum.FP32,
          outputPrecisions: [ModelPrecisionEnum.FP32],
          details: [],
        },
      ],
      runtimePrecisionsAvailable: true,
      layerTimeDistribution: [],
      precisionDistribution: null,
      precisionTransitions: null,
      config: null,
    };
    component.model = mockModelItemList[0];
    component.runtimeGraph = { id: null, xmlContent: '', isLoading: false, error: null };
    component.originalGraph = { id: null, xmlContent: '', isLoading: false, error: null };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
