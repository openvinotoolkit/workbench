import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { StoreModule } from '@ngrx/store';

import { MessagesService } from '@core/services/common/messages.service';

import { RootStoreState } from '@store';

import { SharedModule } from '@shared/shared.module';

import { TokenizersTableComponent } from './tokenizers-table.component';

describe('TokenizersTableComponent', () => {
  let component: TokenizersTableComponent;
  let fixture: ComponentFixture<TokenizersTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        RouterTestingModule,
        SharedModule,
        StoreModule.forRoot({
          ...RootStoreState.reducers,
        }),
      ],
      declarations: [TokenizersTableComponent],
      providers: [MessagesService],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TokenizersTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
