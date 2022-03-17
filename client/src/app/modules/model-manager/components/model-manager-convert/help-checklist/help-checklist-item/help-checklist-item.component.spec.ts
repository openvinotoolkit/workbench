import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { HelpChecklistItemComponent } from './help-checklist-item.component';
import { HelpChecklistModule } from '../help-checklist.module';

describe('HelpChecklistItemComponent', () => {
  let component: HelpChecklistItemComponent;
  let fixture: ComponentFixture<HelpChecklistItemComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [BrowserAnimationsModule, HelpChecklistModule],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(HelpChecklistItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
