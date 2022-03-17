import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { of } from 'rxjs';

import { CoreModule } from '@core/core.module';

import { SharedModule } from '@shared/shared.module';

import { CalibrationConfigurationComponent } from './calibration-configuration.component';
import { DatasetListComponent } from '../../components/dataset-list/dataset-list.component';

describe('CalibrationConfigurationComponent', () => {
  let component: CalibrationConfigurationComponent;
  let fixture: ComponentFixture<CalibrationConfigurationComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [RouterTestingModule, CoreModule, SharedModule],
        declarations: [CalibrationConfigurationComponent, DatasetListComponent],
        providers: [
          {
            provide: ActivatedRoute,
            useValue: {
              params: of({ projectId: 1 }),
            },
          },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(CalibrationConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
