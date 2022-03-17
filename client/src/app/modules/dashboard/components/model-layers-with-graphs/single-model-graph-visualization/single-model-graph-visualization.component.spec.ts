import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { StoreModule } from '@ngrx/store';
import { Angulartics2Module } from 'angulartics2';

import { RootStoreState } from '@store';

import { SharedModule } from '@shared/shared.module';

import { SingleModelGraphVisualizationComponent } from './single-model-graph-visualization.component';
import { ModelGraphVisualizationService } from '../model-graph-visualization/model-graph-visualization.service';
import { ModelGraphLayersService } from '../model-graph-visualization/model-graph-layers.service';

describe('SingleModelGraphVisualizationComponent', () => {
  let component: SingleModelGraphVisualizationComponent;
  let fixture: ComponentFixture<SingleModelGraphVisualizationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        SharedModule,
        StoreModule.forRoot({
          ...RootStoreState.reducers,
        }),
        Angulartics2Module.forRoot(),
        RouterTestingModule,
      ],
      declarations: [SingleModelGraphVisualizationComponent],
      providers: [ModelGraphVisualizationService, ModelGraphLayersService],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SingleModelGraphVisualizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
