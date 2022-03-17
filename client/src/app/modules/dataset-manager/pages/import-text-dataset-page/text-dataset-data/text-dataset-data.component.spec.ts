import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { SharedModule } from '@shared/shared.module';

import { TextDatasetDataComponent } from './text-dataset-data.component';
import { DatasetManagerModule } from '../../../dataset-manager.module';

describe('TextDatasetDataComponent', () => {
  let component: TextDatasetDataComponent;
  let fixture: ComponentFixture<TextDatasetDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule, NoopAnimationsModule, DatasetManagerModule],
      declarations: [TextDatasetDataComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TextDatasetDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
