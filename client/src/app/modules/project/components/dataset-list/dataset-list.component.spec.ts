import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { StoreModule } from '@ngrx/store';

import { RootStoreState } from '@store';
import { mockDatasetItemList } from '@store/dataset-store/dataset.reducer.spec';

import { SharedModule } from '@shared/shared.module';

import { DatasetListComponent } from './dataset-list.component';

describe('DatasetListComponent', () => {
  let component: DatasetListComponent;
  let fixture: ComponentFixture<DatasetListComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [
          BrowserAnimationsModule,
          SharedModule,
          StoreModule.forRoot({
            ...RootStoreState.reducers,
          }),
        ],
        declarations: [DatasetListComponent],
        providers: [],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(DatasetListComponent);
    component = fixture.componentInstance;
    component.datasets = mockDatasetItemList;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
