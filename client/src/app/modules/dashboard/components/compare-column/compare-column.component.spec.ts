import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { StoreModule } from '@ngrx/store';

import { GoogleAnalyticsService } from '@core/services/common/google-analytics.service';

import { RootStoreState } from '@store';

import { SharedModule } from '@shared/shared.module';

import { CompareColumnComponent } from './compare-column.component';
import { PointsTableComponent } from '../points-table/points-table.component';
import { BenchmarkChartComponent } from '../benchmark-chart/benchmark-chart.component';

describe('CompareColumnComponent', () => {
  let component: CompareColumnComponent;
  let fixture: ComponentFixture<CompareColumnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        SharedModule,
        StoreModule.forRoot({
          ...RootStoreState.reducers,
        }),
      ],
      declarations: [CompareColumnComponent, PointsTableComponent, BenchmarkChartComponent],
      providers: [GoogleAnalyticsService],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CompareColumnComponent);
    component = fixture.componentInstance;
    component.side = 'a';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  afterEach(() => {
    fixture.destroy();
  });
});
