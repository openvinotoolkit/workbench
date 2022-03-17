import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { SharedModule } from '@shared/shared.module';

import { OptimizePerformanceRibbonContentComponent } from './optimize-performance-ribbon-content.component';

describe('OptimizePerformanceRibbonContentComponent', () => {
  let component: OptimizePerformanceRibbonContentComponent;
  let fixture: ComponentFixture<OptimizePerformanceRibbonContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule, RouterTestingModule],
      declarations: [OptimizePerformanceRibbonContentComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OptimizePerformanceRibbonContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
