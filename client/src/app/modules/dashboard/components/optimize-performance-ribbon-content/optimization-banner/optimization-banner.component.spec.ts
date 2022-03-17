import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from '@shared/shared.module';

import { OptimizationBannerComponent } from './optimization-banner.component';

describe('OptimizationBannerComponent', () => {
  let component: OptimizationBannerComponent;
  let fixture: ComponentFixture<OptimizationBannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule],
      declarations: [OptimizationBannerComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OptimizationBannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
