import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelZooContentComponent } from './model-zoo-content.component';

describe('ModelZooContentComponent', () => {
  let component: ModelZooContentComponent;
  let fixture: ComponentFixture<ModelZooContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ModelZooContentComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModelZooContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
