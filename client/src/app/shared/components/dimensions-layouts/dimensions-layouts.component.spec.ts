import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { SharedModule } from '@shared/shared.module';

import { DimensionsLayoutsComponent } from './dimensions-layouts.component';

describe('DimensionsLayoutsComponent', () => {
  let component: DimensionsLayoutsComponent;
  let fixture: ComponentFixture<DimensionsLayoutsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DimensionsLayoutsComponent],
      imports: [BrowserAnimationsModule, SharedModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DimensionsLayoutsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
