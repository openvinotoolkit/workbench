import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClassificationColumnsFormComponent } from './classification-columns-form.component';

describe('ClassificationColumnsFormComponent', () => {
  let component: ClassificationColumnsFormComponent;
  let fixture: ComponentFixture<ClassificationColumnsFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClassificationColumnsFormComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClassificationColumnsFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
