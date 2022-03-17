import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelZooFilterGroupComponent } from './model-zoo-filter-group.component';

describe('ModelZooFilterGroupComponent', () => {
  let component: ModelZooFilterGroupComponent;
  let fixture: ComponentFixture<ModelZooFilterGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ModelZooFilterGroupComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModelZooFilterGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
