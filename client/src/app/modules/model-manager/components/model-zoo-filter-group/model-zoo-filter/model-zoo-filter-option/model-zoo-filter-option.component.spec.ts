import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelZooFilterOptionComponent } from './model-zoo-filter-option.component';

describe('ModelZooFilterOptionComponent', () => {
  let component: ModelZooFilterOptionComponent<unknown>;
  let fixture: ComponentFixture<ModelZooFilterOptionComponent<unknown>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ModelZooFilterOptionComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModelZooFilterOptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
