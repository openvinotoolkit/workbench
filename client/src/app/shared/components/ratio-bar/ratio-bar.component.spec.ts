import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RatioBarComponent } from './ratio-bar.component';

describe('HueBarComponent', () => {
  let component: RatioBarComponent;
  let fixture: ComponentFixture<RatioBarComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [RatioBarComponent],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(RatioBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
