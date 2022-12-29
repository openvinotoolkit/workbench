import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import {
  MAT_LEGACY_SNACK_BAR_DATA as MAT_SNACK_BAR_DATA,
  MatLegacySnackBarRef as MatSnackBarRef,
} from '@angular/material/legacy-snack-bar';
import { RouterTestingModule } from '@angular/router/testing';

import { StoreModule } from '@ngrx/store';

import { SnackBarTypes } from '@core/services/common/popup.config';

import { RootStoreState } from '@store';

import { SharedModule } from '@shared/shared.module';

import { AnalyticsPopupComponent } from './analytics-popup.component';

describe('AnalyticsPopupComponent', () => {
  let component: AnalyticsPopupComponent;
  let fixture: ComponentFixture<AnalyticsPopupComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AnalyticsPopupComponent],
      imports: [
        SharedModule,
        RouterTestingModule,
        StoreModule.forRoot({
          ...RootStoreState.reducers,
        }),
      ],
      providers: [
        {
          provide: MatSnackBarRef,
          useValue: {},
        },
        {
          provide: MAT_SNACK_BAR_DATA,
          useValue: { message: '', type: SnackBarTypes.COOKIE_SNACK_BAR },
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AnalyticsPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
