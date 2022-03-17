import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { StoreModule } from '@ngrx/store';

import { RootStoreState } from '@store/index';

import { SharedModule } from '@shared/shared.module';

import { DeploymentManagerComponent } from './deployment-manager.component';

describe('DeploymentManagerComponent', () => {
  let component: DeploymentManagerComponent;
  let fixture: ComponentFixture<DeploymentManagerComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [
          SharedModule,
          StoreModule.forRoot({
            ...RootStoreState.reducers,
          }),
          RouterTestingModule,
        ],
        declarations: [DeploymentManagerComponent],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(DeploymentManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
