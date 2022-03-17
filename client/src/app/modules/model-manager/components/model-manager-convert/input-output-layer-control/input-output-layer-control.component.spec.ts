import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { SharedModule } from '@shared/shared.module';
import { DimensionsInputComponent } from '@shared/components/dimensions-input/dimensions-input.component';

import { InputOutputLayerControlComponent } from './input-output-layer-control.component';

describe('InputOutputLayerControlComponent', () => {
  let component: InputOutputLayerControlComponent;
  let fixture: ComponentFixture<InputOutputLayerControlComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [InputOutputLayerControlComponent, DimensionsInputComponent],
        imports: [BrowserAnimationsModule, SharedModule],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(InputOutputLayerControlComponent);
    component = fixture.componentInstance;
    component.layerType = 'input';
    component.controlIndex = 1;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
