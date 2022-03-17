import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { StoreModule } from '@ngrx/store';

import { RootStoreState } from '@store';

import { SharedModule } from '@shared/shared.module';

import { RunningInferenceOverlayComponent } from './running-inference-overlay.component';

describe('RunningInferenceOverlayComponent', () => {
  let component: RunningInferenceOverlayComponent;
  let fixture: ComponentFixture<RunningInferenceOverlayComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [
          SharedModule,
          NoopAnimationsModule,
          StoreModule.forRoot({
            ...RootStoreState.reducers,
          }),
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(RunningInferenceOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
