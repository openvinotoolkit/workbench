import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntailmentColumnsFormComponent } from './entailment-columns-form.component';

describe('EntailmentColumnsFormComponent', () => {
  let component: EntailmentColumnsFormComponent;
  let fixture: ComponentFixture<EntailmentColumnsFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EntailmentColumnsFormComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EntailmentColumnsFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
