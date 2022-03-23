import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OmzModelDetailsComponent } from './omz-model-details.component';

describe('OmzModelDetailsComponent', () => {
  let component: OmzModelDetailsComponent;
  let fixture: ComponentFixture<OmzModelDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OmzModelDetailsComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OmzModelDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
