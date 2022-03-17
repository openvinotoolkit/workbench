import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { StoreModule } from '@ngrx/store';

import { SessionService } from '@core/services/common/session.service';
import { MessagesService } from '@core/services/common/messages.service';
import { SessionDurationPipe } from '@core/header/session-timer/session-duration.pipe';

import { RootStoreState } from '@store';

import { SharedModule } from '@shared/shared.module';

import { SessionTimerComponent } from './session-timer.component';

describe('SessionTimerComponent', () => {
  let component: SessionTimerComponent;
  let fixture: ComponentFixture<SessionTimerComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [
          StoreModule.forRoot({
            ...RootStoreState.reducers,
          }),
          SharedModule,
        ],
        declarations: [SessionTimerComponent, SessionDurationPipe],
        providers: [SessionService, MessagesService],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(SessionTimerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
