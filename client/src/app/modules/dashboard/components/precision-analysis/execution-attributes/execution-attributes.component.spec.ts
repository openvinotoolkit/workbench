import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExecutionAttributesComponent } from './execution-attributes.component';

describe('ExecutionAttributesComponent', () => {
  let component: ExecutionAttributesComponent;
  let fixture: ComponentFixture<ExecutionAttributesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExecutionAttributesComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExecutionAttributesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
