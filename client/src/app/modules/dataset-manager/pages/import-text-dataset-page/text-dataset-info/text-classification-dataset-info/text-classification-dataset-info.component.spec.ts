import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessagesService } from '@core/services/common/messages.service';

import { TextClassificationDatasetInfoComponent } from './text-classification-dataset-info.component';

describe('TextClassificationDatasetInfoComponent', () => {
  let component: TextClassificationDatasetInfoComponent;
  let fixture: ComponentFixture<TextClassificationDatasetInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TextClassificationDatasetInfoComponent],
      providers: [MessagesService],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TextClassificationDatasetInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
