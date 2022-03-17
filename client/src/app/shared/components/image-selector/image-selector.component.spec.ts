import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { MessagesService } from '@core/services/common/messages.service';

import { SharedModule } from '@shared/shared.module';

import { ImageSelectorComponent } from './image-selector.component';

describe('ImageSelectorComponent', () => {
  let component: ImageSelectorComponent;
  let fixture: ComponentFixture<ImageSelectorComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [SharedModule],
        declarations: [ImageSelectorComponent],
        providers: [MessagesService],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ImageSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
