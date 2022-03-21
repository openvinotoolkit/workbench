import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { StoreModule } from '@ngrx/store';

import { RootStoreState } from '@store';

import { SharedModule } from '@shared/shared.module';

import { OmzImportRibbonContentComponent } from './omz-import-ribbon-content.component';
import { ModelZooFilterGroupComponent } from '../model-zoo-filter-group/model-zoo-filter-group.component';

describe('OmzImportRibbonContentComponent', () => {
  let component: OmzImportRibbonContentComponent;
  let fixture: ComponentFixture<OmzImportRibbonContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SharedModule,
        NoopAnimationsModule,
        RouterTestingModule,
        StoreModule.forRoot({
          ...RootStoreState.reducers,
        }),
      ],
      declarations: [OmzImportRibbonContentComponent, ModelZooFilterGroupComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OmzImportRibbonContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
