import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { StoreModule } from '@ngrx/store';
import { Angulartics2Module } from 'angulartics2';

import { RootStoreState } from '@store';

import { SharedModule } from '@shared/shared.module';

import { EditAccuracyComponent } from './edit-accuracy.component';
import { BasicAccuracyConfigurationComponent } from '../../components/basic-accuracy-configuration/basic-accuracy-configuration.component';

describe('EditAccuracyComponent', () => {
  let component: EditAccuracyComponent;
  let fixture: ComponentFixture<EditAccuracyComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [
          Angulartics2Module.forRoot(),
          BrowserAnimationsModule,
          RouterTestingModule,
          SharedModule,
          StoreModule.forRoot({
            ...RootStoreState.reducers,
          }),
        ],
        declarations: [EditAccuracyComponent, BasicAccuracyConfigurationComponent],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(EditAccuracyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
