import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { StoreModule } from '@ngrx/store';

import { RootStoreState } from '@store';

import { SharedModule } from '@shared/shared.module';

import { ModelDownloaderTableComponent } from './model-downloader-table.component';
import { ModelDownloaderService } from './model-downloader.service';

describe('ModelDownloaderTableComponent', () => {
  let component: ModelDownloaderTableComponent;
  let fixture: ComponentFixture<ModelDownloaderTableComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [
          BrowserAnimationsModule,
          RouterTestingModule,
          SharedModule,
          StoreModule.forRoot({
            ...RootStoreState.reducers,
          }),
        ],
        declarations: [ModelDownloaderTableComponent],
        providers: [ModelDownloaderService],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ModelDownloaderTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
