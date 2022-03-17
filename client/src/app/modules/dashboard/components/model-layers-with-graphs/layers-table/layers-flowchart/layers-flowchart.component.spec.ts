import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { LayersFlowchartComponent } from './layers-flowchart.component';
import { LayersTableModule } from '../layers-table.module';

describe('LayersFlowchartComponent', () => {
  let component: LayersFlowchartComponent;
  let fixture: ComponentFixture<LayersFlowchartComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [LayersTableModule],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(LayersFlowchartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
