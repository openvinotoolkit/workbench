import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExplainableAiDescriptionComponent } from './explainable-ai-description.component';

describe('ExplainableAiDescriptionComponent', () => {
  let component: ExplainableAiDescriptionComponent;
  let fixture: ComponentFixture<ExplainableAiDescriptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExplainableAiDescriptionComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExplainableAiDescriptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
