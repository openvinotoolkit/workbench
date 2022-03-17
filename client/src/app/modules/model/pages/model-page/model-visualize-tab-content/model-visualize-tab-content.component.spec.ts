import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { StoreModule } from '@ngrx/store';
import { Angulartics2Module } from 'angulartics2';

import { RootStoreState } from '@store';

import { SharedModule } from '@shared/shared.module';

import { ModelVisualizeTabContentComponent } from './model-visualize-tab-content.component';

describe('ModelVisualizeTabContentComponent', () => {
  let component: ModelVisualizeTabContentComponent;
  let fixture: ComponentFixture<ModelVisualizeTabContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        SharedModule,
        StoreModule.forRoot({
          ...RootStoreState.reducers,
        }),
        Angulartics2Module.forRoot(),
      ],
      declarations: [ModelVisualizeTabContentComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModelVisualizeTabContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
