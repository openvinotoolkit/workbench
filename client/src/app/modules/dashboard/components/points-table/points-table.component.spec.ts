import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PointsTableComponent } from './points-table.component';

describe('PointsTableComponent', () => {
  let component: PointsTableComponent;
  let fixture: ComponentFixture<PointsTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PointsTableComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PointsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
