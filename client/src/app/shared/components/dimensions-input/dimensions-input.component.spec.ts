import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { SharedModule } from '@shared/shared.module';

import { DimensionsInputComponent } from './dimensions-input.component';

describe('DimensionsInputComponent', () => {
  let component: DimensionsInputComponent;
  let fixture: ComponentFixture<DimensionsInputComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [DimensionsInputComponent],
        imports: [BrowserAnimationsModule, SharedModule],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(DimensionsInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
