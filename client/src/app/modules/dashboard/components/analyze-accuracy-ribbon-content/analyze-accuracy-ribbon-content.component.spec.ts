import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { StoreModule } from '@ngrx/store';
import { Angulartics2Module } from 'angulartics2';

import { MessagesService } from '@core/services/common/messages.service';

import { RootStoreState } from '@store';

import { SharedModule } from '@shared/shared.module';

import { AnalyzeAccuracyRibbonContentComponent } from './analyze-accuracy-ribbon-content.component';

describe('AnalyzeAccuracyRibbonContentComponent', () => {
  let component: AnalyzeAccuracyRibbonContentComponent;
  let fixture: ComponentFixture<AnalyzeAccuracyRibbonContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SharedModule,
        NoopAnimationsModule,
        RouterTestingModule,
        StoreModule.forRoot({
          ...RootStoreState.reducers,
        }),
        Angulartics2Module.forRoot(),
      ],
      declarations: [AnalyzeAccuracyRibbonContentComponent],
      providers: [MessagesService],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AnalyzeAccuracyRibbonContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
