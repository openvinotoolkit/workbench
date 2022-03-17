import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { StoreModule } from '@ngrx/store';

import { RootStoreState } from '@store';

import { SharedModule } from '@shared/shared.module';

import { ReshapeComponent } from './reshape.component';

describe('ReshapeComponent', () => {
  let component: ReshapeComponent;
  let fixture: ComponentFixture<ReshapeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        SharedModule,
        StoreModule.forRoot({
          ...RootStoreState.reducers,
        }),
      ],
      declarations: [ReshapeComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReshapeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
