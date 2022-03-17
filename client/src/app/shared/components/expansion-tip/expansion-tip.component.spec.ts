import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { SharedModule } from '@shared/shared.module';

import { ExpansionTipComponent } from './expansion-tip.component';

describe('ExpansionTipComponent', () => {
  let component: ExpansionTipComponent;
  let fixture: ComponentFixture<ExpansionTipComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [BrowserAnimationsModule, SharedModule],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ExpansionTipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
