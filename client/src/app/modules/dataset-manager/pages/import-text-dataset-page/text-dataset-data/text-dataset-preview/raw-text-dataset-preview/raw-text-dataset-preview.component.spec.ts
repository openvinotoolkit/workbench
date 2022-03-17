import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RawTextDatasetPreviewComponent } from './raw-text-dataset-preview.component';

describe('RawTextDatasetPreviewComponent', () => {
  let component: RawTextDatasetPreviewComponent;
  let fixture: ComponentFixture<RawTextDatasetPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RawTextDatasetPreviewComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RawTextDatasetPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
