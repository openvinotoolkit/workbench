import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { StoreModule } from '@ngrx/store';
import { Angulartics2Module } from 'angulartics2';

import { MessagesService } from '@core/services/common/messages.service';

import { RootStoreState } from '@store';

import { SharedModule } from '@shared/shared.module';

import { ImportTokenizerPageComponent } from './import-tokenizer-page.component';
import { ModelModule } from '../../model.module';

describe('ImportTokenizerPageComponent', () => {
  let component: ImportTokenizerPageComponent;
  let fixture: ComponentFixture<ImportTokenizerPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        RouterTestingModule,
        SharedModule,
        ModelModule,
        Angulartics2Module.forRoot(),
        StoreModule.forRoot({
          ...RootStoreState.reducers,
        }),
      ],
      declarations: [ImportTokenizerPageComponent],
      providers: [MessagesService],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ImportTokenizerPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
