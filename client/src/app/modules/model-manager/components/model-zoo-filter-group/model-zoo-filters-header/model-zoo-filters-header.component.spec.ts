import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelZooFiltersHeaderComponent } from './model-zoo-filters-header.component';

describe('ModelZooFiltersHeaderComponent', () => {
  let component: ModelZooFiltersHeaderComponent;
  let fixture: ComponentFixture<ModelZooFiltersHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ModelZooFiltersHeaderComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModelZooFiltersHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
