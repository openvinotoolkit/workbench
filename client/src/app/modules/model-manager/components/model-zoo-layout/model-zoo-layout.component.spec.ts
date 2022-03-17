import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelZooLayoutComponent } from './model-zoo-layout.component';

describe('ModelZooLayoutComponent', () => {
  let component: ModelZooLayoutComponent;
  let fixture: ComponentFixture<ModelZooLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ModelZooLayoutComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModelZooLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
