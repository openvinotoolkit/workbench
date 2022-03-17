import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { Angulartics2Module } from 'angulartics2';

import { SharedModule } from '@shared/shared.module';

import { ModelLayersWithGraphsModule } from '../model-layers-with-graphs.module';
import { ModelGraphVisualizationComponent } from './model-graph-visualization.component';
import { ModelGraphVisualizationService } from './model-graph-visualization.service';
import { ModelGraphLayersService } from './model-graph-layers.service';

describe('ModelGraphVisualizationComponent', () => {
  let component: ModelGraphVisualizationComponent;
  let fixture: ComponentFixture<ModelGraphVisualizationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SharedModule,
        BrowserAnimationsModule,
        ModelLayersWithGraphsModule,
        Angulartics2Module.forRoot(),
        RouterTestingModule,
      ],
      declarations: [ModelGraphVisualizationComponent],
      providers: [ModelGraphVisualizationService, ModelGraphLayersService],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModelGraphVisualizationComponent);
    component = fixture.componentInstance;
    component.runtimeGraph = { id: null, xmlContent: '', isLoading: false, error: null };
    component.originalGraph = { id: null, xmlContent: '', isLoading: false, error: null };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
