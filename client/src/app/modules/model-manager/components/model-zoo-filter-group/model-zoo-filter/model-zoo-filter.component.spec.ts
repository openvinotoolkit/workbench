import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelZooFilterComponent } from './model-zoo-filter.component';

describe('ModelZooFilterComponent', () => {
  let component: ModelZooFilterComponent<unknown>;
  let fixture: ComponentFixture<ModelZooFilterComponent<unknown>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ModelZooFilterComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModelZooFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
