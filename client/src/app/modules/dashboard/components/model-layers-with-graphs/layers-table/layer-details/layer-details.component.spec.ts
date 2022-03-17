import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { LayerDetailsComponent } from './layer-details.component';
import { LayersTableModule } from '../layers-table.module';

describe('LayerDetailsComponent', () => {
  let component: LayerDetailsComponent;
  let fixture: ComponentFixture<LayerDetailsComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [LayersTableModule],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(LayerDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
