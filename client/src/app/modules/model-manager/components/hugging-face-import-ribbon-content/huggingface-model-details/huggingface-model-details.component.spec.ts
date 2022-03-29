import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoreModule } from '@ngrx/store';

import { HuggingfaceService } from '@core/services/api/rest/huggingface.service';

import { RootStoreState } from '@store';

import { SharedModule } from '@shared/shared.module';

import { HuggingfaceModelDetailsComponent } from './huggingface-model-details.component';
import { MarkdownService } from './markdown/markdown.service';

describe('HuggingfaceModelDetailsComponent', () => {
  let component: HuggingfaceModelDetailsComponent;
  let fixture: ComponentFixture<HuggingfaceModelDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SharedModule,
        StoreModule.forRoot({
          ...RootStoreState.reducers,
        }),
      ],
      providers: [HuggingfaceService, MarkdownService],
      declarations: [HuggingfaceModelDetailsComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HuggingfaceModelDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
