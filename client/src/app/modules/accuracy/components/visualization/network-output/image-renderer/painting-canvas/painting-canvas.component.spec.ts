import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaintingCanvasComponent } from './painting-canvas.component';
import { PaintingCanvasManagerService } from '../../painting-canvas-manager.service';

describe('PaintingCanvasComponent', () => {
  let component: PaintingCanvasComponent;
  let fixture: ComponentFixture<PaintingCanvasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PaintingCanvasComponent],
      providers: [PaintingCanvasManagerService],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PaintingCanvasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
