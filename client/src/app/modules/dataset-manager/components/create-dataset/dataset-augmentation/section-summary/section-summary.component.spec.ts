import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SectionSummaryComponent } from './section-summary.component';

describe('SectionSummaryComponent', () => {
  let component: SectionSummaryComponent;
  let fixture: ComponentFixture<SectionSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SectionSummaryComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SectionSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
