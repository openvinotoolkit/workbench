import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { StoreModule } from '@ngrx/store';

import { RootStoreState } from '@store';

import { SharedModule } from '@shared/shared.module';

import { LabelSetsComponent } from './label-sets.component';

describe('LabelSetsComponent', () => {
  let component: LabelSetsComponent;
  let fixture: ComponentFixture<LabelSetsComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [
          SharedModule,
          StoreModule.forRoot({
            ...RootStoreState.reducers,
          }),
        ],
        declarations: [LabelSetsComponent],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(LabelSetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
