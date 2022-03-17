import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { StoreModule } from '@ngrx/store';

import { RootStoreState } from '@store';

import { SharedModule } from '@shared/shared.module';

import { ModelModule } from '../../../model.module';
import { ModelProjectsTabContentComponent } from './model-projects-tab-content.component';

describe('ModelProjectsTabContentComponent', () => {
  let component: ModelProjectsTabContentComponent;
  let fixture: ComponentFixture<ModelProjectsTabContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        ModelModule,
        SharedModule,
        StoreModule.forRoot({
          ...RootStoreState.reducers,
        }),
      ],
      declarations: [ModelProjectsTabContentComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModelProjectsTabContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
