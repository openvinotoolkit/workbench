import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { StoreModule } from '@ngrx/store';
import { Angulartics2Module } from 'angulartics2';

import { RootStoreState } from '@store';

import { SharedModule } from '@shared/shared.module';

import { ImportTextDatasetPageComponent } from './import-text-dataset-page.component';
import { DatasetManagerModule } from '../../dataset-manager.module';

describe('ImportTextDatasetPageComponent', () => {
  let component: ImportTextDatasetPageComponent;
  let fixture: ComponentFixture<ImportTextDatasetPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SharedModule,
        RouterTestingModule,
        NoopAnimationsModule,
        Angulartics2Module.forRoot(),
        DatasetManagerModule,
        StoreModule.forRoot({ ...RootStoreState.reducers }),
      ],
      declarations: [ImportTextDatasetPageComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ImportTextDatasetPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
