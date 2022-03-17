import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SharedModule } from '@shared/shared.module';

import { SwitchButtonComponent } from './switch-button.component';

describe('SwitchButtonComponent', () => {
  let component: SwitchButtonComponent;
  let fixture: ComponentFixture<SwitchButtonComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [SharedModule],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(SwitchButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
