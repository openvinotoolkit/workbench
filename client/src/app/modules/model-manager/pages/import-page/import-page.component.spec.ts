import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoreModule } from '@ngrx/store';

import { RootStoreState } from '@store';

import { ImportPageComponent } from './import-page.component';

describe('ImportPageComponent', () => {
  let component: ImportPageComponent;
  let fixture: ComponentFixture<ImportPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        StoreModule.forRoot({
          ...RootStoreState.reducers,
        }),
      ],
      declarations: [ImportPageComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ImportPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
