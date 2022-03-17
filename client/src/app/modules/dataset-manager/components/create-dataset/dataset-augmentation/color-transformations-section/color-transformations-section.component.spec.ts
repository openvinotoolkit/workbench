import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DecimalPipe } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { StoreModule } from '@ngrx/store';

import { RootStoreState } from '@store';

import { ColorTransformationsSectionComponent } from './color-transformations-section.component';

describe('ColorTransformationsSectionComponent', () => {
  let component: ColorTransformationsSectionComponent;
  let fixture: ComponentFixture<ColorTransformationsSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        StoreModule.forRoot({
          ...RootStoreState.reducers,
        }),
      ],
      declarations: [ColorTransformationsSectionComponent],
      providers: [DecimalPipe],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ColorTransformationsSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
