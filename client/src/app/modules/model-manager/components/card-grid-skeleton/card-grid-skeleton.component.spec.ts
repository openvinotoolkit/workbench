import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardGridSkeletonComponent } from './card-grid-skeleton.component';

describe('CardGridSkeletonComponent', () => {
  let component: CardGridSkeletonComponent;
  let fixture: ComponentFixture<CardGridSkeletonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CardGridSkeletonComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CardGridSkeletonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
