import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelZooNotificationComponent } from './model-zoo-notification.component';

describe('ModelZooNotificationComponent', () => {
  let component: ModelZooNotificationComponent;
  let fixture: ComponentFixture<ModelZooNotificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ModelZooNotificationComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModelZooNotificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
