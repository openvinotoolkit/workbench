import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { StoreModule } from '@ngrx/store';

import { AccuracyRestService } from '@core/services/api/rest/accuracy.service';
import { MessagesService } from '@core/services/common/messages.service';

import { RootStoreState } from '@store';

import { SharedModule } from '@shared/shared.module';

import { AdvancedAccuracyConfigurationComponent } from './advanced-accuracy-configuration.component';
import { StatusBlockComponent } from './status-block/status-block.component';

describe('AdvancedAccuracyConfigurationComponent', () => {
  let component: AdvancedAccuracyConfigurationComponent;
  let fixture: ComponentFixture<AdvancedAccuracyConfigurationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SharedModule,
        StoreModule.forRoot({
          ...RootStoreState.reducers,
        }),
        NoopAnimationsModule,
        RouterTestingModule,
      ],
      providers: [AccuracyRestService, MessagesService],
      declarations: [AdvancedAccuracyConfigurationComponent, StatusBlockComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdvancedAccuracyConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
