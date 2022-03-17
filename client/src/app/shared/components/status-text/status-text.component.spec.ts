import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

import { StatusTextComponent } from './status-text.component';

describe('StatusTextComponent', () => {
  let component: StatusTextComponent;
  let fixture: ComponentFixture<StatusTextComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [CommonModule, MatIconModule],
        declarations: [StatusTextComponent],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(StatusTextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
