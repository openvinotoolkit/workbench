import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { StoreModule } from '@ngrx/store';

import { RootStoreState } from '@store';

import { SharedModule } from '@shared/shared.module';

import { ModelManagerConvertComponent } from './model-manager-convert.component';
import { HelpChecklistModule } from './help-checklist/help-checklist.module';

describe('ModelManagerConvertComponent', () => {
  let component: ModelManagerConvertComponent;
  let fixture: ComponentFixture<ModelManagerConvertComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ModelManagerConvertComponent],
      imports: [
        SharedModule,
        RouterTestingModule,
        StoreModule.forRoot({
          ...RootStoreState.reducers,
        }),
        HelpChecklistModule,
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModelManagerConvertComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
