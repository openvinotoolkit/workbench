import { async, ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SimpleChange } from '@angular/core';

import { LayersCompareTableComponent } from './layers-compare-table.component';
import { LayersTableModule } from '../layers-table.module';

describe('LayersCompareTableComponent', () => {
  let component: LayersCompareTableComponent;
  let fixture: ComponentFixture<LayersCompareTableComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [NoopAnimationsModule, LayersTableModule],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(LayersCompareTableComponent);
    component = fixture.componentInstance;
    component.ngOnChanges({
      layers: new SimpleChange(null, [{}], true),
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
