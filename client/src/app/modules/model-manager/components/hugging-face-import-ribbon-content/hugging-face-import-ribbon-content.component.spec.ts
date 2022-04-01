import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { StoreModule } from '@ngrx/store';

import { MessagesService } from '@core/services/common/messages.service';
import { HuggingfaceService } from '@core/services/api/rest/huggingface.service';

import { RootStoreState } from '@store';

import { SharedModule } from '@shared/shared.module';

import { HuggingFaceImportRibbonContentComponent } from './hugging-face-import-ribbon-content.component';
import { ModelZooFilterGroupComponent } from '../model-zoo-filter-group/model-zoo-filter-group.component';
import { HuggingfaceModelDetailsComponent } from './huggingface-model-details/huggingface-model-details.component';

describe('HuggingFaceImportRibbonContentComponent', () => {
  let component: HuggingFaceImportRibbonContentComponent;
  let fixture: ComponentFixture<HuggingFaceImportRibbonContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SharedModule,
        NoopAnimationsModule,
        RouterTestingModule,
        StoreModule.forRoot({
          ...RootStoreState.reducers,
        }),
      ],
      declarations: [
        HuggingFaceImportRibbonContentComponent,
        ModelZooFilterGroupComponent,
        HuggingfaceModelDetailsComponent,
      ],
      providers: [MessagesService, HuggingfaceService],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HuggingFaceImportRibbonContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
