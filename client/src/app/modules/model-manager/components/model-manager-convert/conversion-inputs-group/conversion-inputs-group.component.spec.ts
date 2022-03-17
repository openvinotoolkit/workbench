import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoreModule } from '@ngrx/store';

import { RootStoreState } from '@store';

import { SharedModule } from '@shared/shared.module';

import { ConversionInputsGroupComponent } from './conversion-inputs-group.component';

describe('ConversionInputsGroupComponent', () => {
  let component: ConversionInputsGroupComponent;
  let fixture: ComponentFixture<ConversionInputsGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConversionInputsGroupComponent],
      imports: [
        SharedModule,
        StoreModule.forRoot({
          ...RootStoreState.reducers,
        }),
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConversionInputsGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
