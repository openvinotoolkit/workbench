import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { SharedModule } from '@shared/shared.module';

import { SelectedInferencesTableComponent } from './selected-inferences-table.component';

describe('SelectedInferencesTableComponent', () => {
  let component: SelectedInferencesTableComponent;
  let fixture: ComponentFixture<SelectedInferencesTableComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [NoopAnimationsModule, SharedModule],
        declarations: [SelectedInferencesTableComponent],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectedInferencesTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
