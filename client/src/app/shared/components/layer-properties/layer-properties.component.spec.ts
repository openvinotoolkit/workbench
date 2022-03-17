import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NetronOpenvinoNode } from '@shared/models/netron';

import { LayerPropertiesComponent } from './layer-properties.component';

describe('LayerPropertiesComponent', () => {
  let component: LayerPropertiesComponent;
  let fixture: ComponentFixture<LayerPropertiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LayerPropertiesComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LayerPropertiesComponent);
    component = fixture.componentInstance;
    component.layer = new NetronOpenvinoNode();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
