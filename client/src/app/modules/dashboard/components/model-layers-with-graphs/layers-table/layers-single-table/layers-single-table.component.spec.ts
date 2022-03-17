import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SimpleChange } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';

import { Angulartics2Module } from 'angulartics2';

import { GoogleAnalyticsService } from '@core/services/common/google-analytics.service';

import { LayersSingleTableComponent } from './layers-single-table.component';
import { LayersTableModule } from '../layers-table.module';

describe('LayersSingleTableComponent', () => {
  let component: LayersSingleTableComponent;
  let fixture: ComponentFixture<LayersSingleTableComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        providers: [GoogleAnalyticsService],
        imports: [
          NoopAnimationsModule,
          LayersTableModule,
          Angulartics2Module.forRoot(),
          RouterTestingModule.withRoutes([]),
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(LayersSingleTableComponent);
    component = fixture.componentInstance;
    component.ngOnChanges({
      layers: new SimpleChange(null, [{}], true),
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
