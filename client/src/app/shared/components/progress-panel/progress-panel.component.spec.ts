import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgressPanelComponent } from './progress-panel.component';

describe('ProgressPanelComponent', () => {
  let component: ProgressPanelComponent;
  let fixture: ComponentFixture<ProgressPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProgressPanelComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgressPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
