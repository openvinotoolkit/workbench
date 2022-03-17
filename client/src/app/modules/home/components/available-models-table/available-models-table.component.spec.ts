import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { SharedModule } from '@shared/shared.module';

import { AvailableModelsTableComponent } from './available-models-table.component';

describe('AvailableModelsTableComponent', () => {
  let component: AvailableModelsTableComponent;
  let fixture: ComponentFixture<AvailableModelsTableComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [BrowserAnimationsModule, SharedModule],
        declarations: [AvailableModelsTableComponent],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(AvailableModelsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
