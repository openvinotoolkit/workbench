import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { StoreModule } from '@ngrx/store';

import { HuggingfaceService } from '@core/services/api/rest/huggingface.service';

import { RootStoreState } from '@store';

import { SharedModule } from '@shared/shared.module';

import { HuggingfaceModelDetailsComponent } from './huggingface-model-details.component';

describe('HuggingfaceModelDetailsComponent', () => {
  let component: HuggingfaceModelDetailsComponent;
  let fixture: ComponentFixture<HuggingfaceModelDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SharedModule,
        RouterTestingModule,
        StoreModule.forRoot({
          ...RootStoreState.reducers,
        }),
      ],
      providers: [HuggingfaceService],
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
