import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { StoreModule } from '@ngrx/store';

import { RootStoreState } from '@store/index';

import { SharedModule } from '@shared/shared.module';

import { ProfileConfigurationComponent } from './profile-configuration.component';

describe('ProfileConfigurationComponent', () => {
  let component: ProfileConfigurationComponent;
  let fixture: ComponentFixture<ProfileConfigurationComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [
          RouterTestingModule,
          SharedModule,
          NoopAnimationsModule,
          StoreModule.forRoot({
            ...RootStoreState.reducers,
          }),
        ],
        declarations: [ProfileConfigurationComponent],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
