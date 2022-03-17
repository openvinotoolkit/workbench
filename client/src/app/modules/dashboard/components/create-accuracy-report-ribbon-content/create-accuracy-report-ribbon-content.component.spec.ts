import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { StoreModule } from '@ngrx/store';

import { MessagesService } from '@core/services/common/messages.service';

import { RootStoreState } from '@store';

import { SharedModule } from '@shared/shared.module';

import { CreateAccuracyReportRibbonContentComponent } from './create-accuracy-report-ribbon-content.component';
import { AccuracyReportTypeRadioGroupComponent } from '../accuracy-report-type-radio-group/accuracy-report-type-radio-group.component';

describe('CreateAccuracyReportRibbonContentComponent', () => {
  let component: CreateAccuracyReportRibbonContentComponent;
  let fixture: ComponentFixture<CreateAccuracyReportRibbonContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SharedModule,
        NoopAnimationsModule,
        RouterTestingModule,
        StoreModule.forRoot({
          ...RootStoreState.reducers,
        }),
      ],
      declarations: [CreateAccuracyReportRibbonContentComponent, AccuracyReportTypeRadioGroupComponent],
      providers: [MessagesService],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateAccuracyReportRibbonContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
