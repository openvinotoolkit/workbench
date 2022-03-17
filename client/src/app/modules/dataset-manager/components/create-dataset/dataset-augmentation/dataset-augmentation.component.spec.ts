import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { SharedModule } from '@shared/shared.module';

import { DatasetAugmentationComponent } from './dataset-augmentation.component';

describe('DatasetAugmentationComponent', () => {
  let component: DatasetAugmentationComponent;
  let fixture: ComponentFixture<DatasetAugmentationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrowserAnimationsModule, SharedModule],
      declarations: [DatasetAugmentationComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DatasetAugmentationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
