import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { HelpChecklistComponent } from './help-checklist.component';
import { HelpChecklistModule } from './help-checklist.module';

describe('HelpChecklistComponent', () => {
  let component: HelpChecklistComponent;
  let fixture: ComponentFixture<HelpChecklistComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [HelpChecklistModule],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(HelpChecklistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
