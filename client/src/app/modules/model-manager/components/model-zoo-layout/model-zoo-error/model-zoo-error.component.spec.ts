import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelZooErrorComponent } from './model-zoo-error.component';

describe('ModelZooErrorComponent', () => {
  let component: ModelZooErrorComponent;
  let fixture: ComponentFixture<ModelZooErrorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ModelZooErrorComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModelZooErrorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
