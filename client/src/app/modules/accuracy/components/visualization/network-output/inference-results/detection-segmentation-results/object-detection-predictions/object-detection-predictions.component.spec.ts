import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessagesService } from '@core/services/common/messages.service';

import { ObjectDetectionPredictionsComponent } from './object-detection-predictions.component';

describe('ObjectDetectionPredictionsComponent', () => {
  let component: ObjectDetectionPredictionsComponent;
  let fixture: ComponentFixture<ObjectDetectionPredictionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ObjectDetectionPredictionsComponent],
      providers: [MessagesService],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ObjectDetectionPredictionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
