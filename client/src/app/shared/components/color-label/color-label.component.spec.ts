import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ColorLabelComponent } from './color-label.component';

describe('ColorLabelComponent', () => {
  let component: ColorLabelComponent;
  let fixture: ComponentFixture<ColorLabelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ColorLabelComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ColorLabelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
