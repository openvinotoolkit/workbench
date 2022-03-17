import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { StoreModule } from '@ngrx/store';

import { RootStoreState } from '@store';

import { SharedModule } from '@shared/shared.module';

import { ModelPageComponent } from './model-page.component';

describe('ModelPageComponent', () => {
  let component: ModelPageComponent;
  let fixture: ComponentFixture<ModelPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        SharedModule,
        StoreModule.forRoot({
          ...RootStoreState.reducers,
        }),
      ],
      declarations: [ModelPageComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModelPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
