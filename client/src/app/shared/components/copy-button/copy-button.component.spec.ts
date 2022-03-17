import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { SharedModule } from '@shared/shared.module';

import { CopyButtonComponent } from './copy-button.component';

describe('CopyButtonComponent', () => {
  let component: CopyButtonComponent;
  let fixture: ComponentFixture<CopyButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrowserAnimationsModule, SharedModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CopyButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should execute copy to the clipboard command', async () => {
    component.valueToCopy = 'copy content';
    fixture.detectChanges();

    const execCommandSpy = spyOn(document, 'execCommand').and.callThrough();

    component.copyValue();

    expect(execCommandSpy).toHaveBeenCalledWith('copy');
    expect(execCommandSpy).toHaveBeenCalledTimes(1);
  });
});
