import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UntypedFormControl } from '@angular/forms';

import { Subject } from 'rxjs';

import { StatusBlockComponent } from './status-block.component';

describe('StatusBlockComponent', () => {
  let component: StatusBlockComponent;
  let fixture: ComponentFixture<StatusBlockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StatusBlockComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StatusBlockComponent);
    component = fixture.componentInstance;
    component.acConfigControl = { statusChanges: new Subject() } as unknown as UntypedFormControl;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
