import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { SharedModule } from '@shared/shared.module';

import { VisualizationConfigurationComponent } from './visualization-configuration.component';

describe('VisualizationConfigurationComponent', () => {
  let component: VisualizationConfigurationComponent;
  let fixture: ComponentFixture<VisualizationConfigurationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule, NoopAnimationsModule],
      declarations: [VisualizationConfigurationComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VisualizationConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
