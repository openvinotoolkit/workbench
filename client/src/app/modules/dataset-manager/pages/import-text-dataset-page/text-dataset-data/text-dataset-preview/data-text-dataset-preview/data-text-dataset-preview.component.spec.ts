import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from '@shared/shared.module';

import { DataTextDatasetPreviewComponent } from './data-text-dataset-preview.component';
import { DatasetManagerModule } from '../../../../../dataset-manager.module';

describe('DataTextDatasetPreviewComponent', () => {
  let component: DataTextDatasetPreviewComponent;
  let fixture: ComponentFixture<DataTextDatasetPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule, DatasetManagerModule],
      declarations: [DataTextDatasetPreviewComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DataTextDatasetPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
