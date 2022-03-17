import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { StoreModule } from '@ngrx/store';

import { MessagesService } from '@core/services/common/messages.service';

import { RootStoreState } from '@store';

import { SharedModule } from '@shared/shared.module';

import { TokenizerRibbonContentComponent } from './tokenizer-ribbon-content.component';
import { ModelModule } from '../../../../model.module';

describe('TokenizerRibbonContentComponent', () => {
  let component: TokenizerRibbonContentComponent;
  let fixture: ComponentFixture<TokenizerRibbonContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ModelModule,
        RouterTestingModule,
        SharedModule,
        StoreModule.forRoot({
          ...RootStoreState.reducers,
        }),
      ],
      declarations: [TokenizerRibbonContentComponent],
      providers: [MessagesService],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TokenizerRibbonContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
