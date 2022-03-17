import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { StoreModule } from '@ngrx/store';
import { Angulartics2Module } from 'angulartics2';

import { RootStoreState } from '@store';

import { SharedModule } from '@shared/shared.module';

import { CreateProjectPageComponent } from './create-project-page.component';
import { ProjectModule } from '../../project.module';
import { TargetMachinesModule } from '../../../target-machines/target-machines.module';

// TODO 61174
xdescribe('CreateProjectComponent', () => {
  let component: CreateProjectPageComponent;
  let fixture: ComponentFixture<CreateProjectPageComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [
          Angulartics2Module.forRoot(),
          BrowserAnimationsModule,
          RouterTestingModule,
          SharedModule,
          ProjectModule,
          TargetMachinesModule,
          StoreModule.forRoot({
            ...RootStoreState.reducers,
          }),
        ],
        declarations: [CreateProjectPageComponent],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateProjectPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
