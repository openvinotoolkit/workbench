import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HuggingfaceModelDetailsComponent } from './huggingface-model-details.component';

describe('HuggingfaceModelDetailsComponent', () => {
  let component: HuggingfaceModelDetailsComponent;
  let fixture: ComponentFixture<HuggingfaceModelDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
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
