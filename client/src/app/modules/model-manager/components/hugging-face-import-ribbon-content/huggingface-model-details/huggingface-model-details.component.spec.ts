import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HuggingfaceService } from '@core/services/api/rest/huggingface.service';

import { SharedModule } from '@shared/shared.module';

import { HuggingfaceModelDetailsComponent } from './huggingface-model-details.component';
import { MarkdownService } from './markdown/markdown.service';

describe('HuggingfaceModelDetailsComponent', () => {
  let component: HuggingfaceModelDetailsComponent;
  let fixture: ComponentFixture<HuggingfaceModelDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: [HuggingfaceService, MarkdownService],
      declarations: [HuggingfaceModelDetailsComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HuggingfaceModelDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
