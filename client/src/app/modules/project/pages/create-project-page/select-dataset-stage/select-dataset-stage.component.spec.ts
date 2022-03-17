import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { StoreModule } from '@ngrx/store';

import { RootStoreState } from '@store';

import { SharedModule } from '@shared/shared.module';

import { SelectDatasetStageComponent } from './select-dataset-stage.component';
import { DatasetListComponent } from '../../../components/dataset-list/dataset-list.component';

// TODO 61174
xdescribe('SelectDatasetStageComponent', () => {
  let component: SelectDatasetStageComponent;
  let fixture: ComponentFixture<SelectDatasetStageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        SharedModule,
        StoreModule.forRoot({
          ...RootStoreState.reducers,
        }),
      ],
      declarations: [SelectDatasetStageComponent, DatasetListComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectDatasetStageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
