import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { StoreModule } from '@ngrx/store';
import { Angulartics2Module } from 'angulartics2';

import { RootStoreState } from '@store/index';

import { SharedModule } from '@shared/shared.module';

import { InferenceConfigurationPageComponent } from './inference-configuration-page.component';
import { InferenceConfigurationService } from './inference-configuration.service';
import { InferenceMatrixSelectComponent } from '../../components/inference-matrix-select/inference-matrix-select.component';
import { InferenceMatrixCellComponent } from '../../components/inference-matrix-select/inference-matrix-cell/inference-matrix-cell.component';
import { SelectedInferencesTableComponent } from '../../components/selected-inferences-table/selected-inferences-table.component';

describe('InferenceConfigurationPageComponent', () => {
  let component: InferenceConfigurationPageComponent;
  let fixture: ComponentFixture<InferenceConfigurationPageComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [
          Angulartics2Module.forRoot(),
          RouterTestingModule,
          SharedModule,
          NoopAnimationsModule,
          StoreModule.forRoot({
            ...RootStoreState.reducers,
          }),
        ],
        declarations: [
          InferenceConfigurationPageComponent,
          InferenceMatrixSelectComponent,
          InferenceMatrixCellComponent,
          SelectedInferencesTableComponent,
        ],
        providers: [InferenceConfigurationService],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(InferenceConfigurationPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
