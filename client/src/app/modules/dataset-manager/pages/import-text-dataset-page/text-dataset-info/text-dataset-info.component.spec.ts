import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessagesService } from '@core/services/common/messages.service';

import { TextDatasetInfoComponent } from './text-dataset-info.component';

describe('TextDatasetInfoComponent', () => {
  let component: TextDatasetInfoComponent;
  let fixture: ComponentFixture<TextDatasetInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TextDatasetInfoComponent],
      providers: [MessagesService],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TextDatasetInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
