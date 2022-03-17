import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessagesService } from '@core/services/common/messages.service';

import { TextualEntailmentDatasetInfoComponent } from './textual-entailment-dataset-info.component';

describe('TextualEntailmentDatasetInfoComponent', () => {
  let component: TextualEntailmentDatasetInfoComponent;
  let fixture: ComponentFixture<TextualEntailmentDatasetInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TextualEntailmentDatasetInfoComponent],
      providers: [MessagesService],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TextualEntailmentDatasetInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
