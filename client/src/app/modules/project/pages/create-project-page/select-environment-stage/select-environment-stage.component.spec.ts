import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { Angulartics2Module } from 'angulartics2';
import { StoreModule } from '@ngrx/store';

import { RootStoreState } from '@store';

import { SharedModule } from '@shared/shared.module';

import { SelectEnvironmentStageComponent } from './select-environment-stage.component';
import { TargetListComponent } from '../../../components/target-list/target-list.component';
import { PlatformListComponent } from '../../../components/platform-list/platform-list.component';

// TODO 61174
xdescribe('SelectEnvironmentStageComponent', () => {
  let component: SelectEnvironmentStageComponent;
  let fixture: ComponentFixture<SelectEnvironmentStageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        Angulartics2Module.forRoot(),
        NoopAnimationsModule,
        RouterTestingModule,
        SharedModule,
        StoreModule.forRoot({
          ...RootStoreState.reducers,
        }),
      ],
      declarations: [SelectEnvironmentStageComponent, TargetListComponent, PlatformListComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectEnvironmentStageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
