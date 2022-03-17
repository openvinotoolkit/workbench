import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from '@shared/shared.module';

import { TextDatasetPreviewComponent } from './text-dataset-preview.component';
import { DatasetManagerModule } from '../../../../dataset-manager.module';

describe('TextDatasetPreviewComponent', () => {
  let component: TextDatasetPreviewComponent;
  let fixture: ComponentFixture<TextDatasetPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule, DatasetManagerModule],
      declarations: [TextDatasetPreviewComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TextDatasetPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
