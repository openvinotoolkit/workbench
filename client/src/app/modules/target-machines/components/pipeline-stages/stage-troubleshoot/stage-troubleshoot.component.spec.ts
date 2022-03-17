import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { SharedModule } from '@shared/shared.module';

import { StageTroubleshootComponent } from './stage-troubleshoot.component';

describe('StageTroubleshootComponent', () => {
  let component: StageTroubleshootComponent;
  let fixture: ComponentFixture<StageTroubleshootComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [SharedModule, BrowserAnimationsModule],
        declarations: [StageTroubleshootComponent],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(StageTroubleshootComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
