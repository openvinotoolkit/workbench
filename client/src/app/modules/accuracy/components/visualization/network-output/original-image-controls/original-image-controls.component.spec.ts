import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { MessagesService } from '@core/services/common/messages.service';

import { SharedModule } from '@shared/shared.module';

import { OriginalImageControlsComponent } from './original-image-controls.component';
import { PaintingCanvasManagerService } from '../painting-canvas-manager.service';

describe('OriginalImageControlsComponent', () => {
  let component: OriginalImageControlsComponent;
  let fixture: ComponentFixture<OriginalImageControlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule, NoopAnimationsModule],
      declarations: [OriginalImageControlsComponent],
      providers: [PaintingCanvasManagerService, MessagesService],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OriginalImageControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
