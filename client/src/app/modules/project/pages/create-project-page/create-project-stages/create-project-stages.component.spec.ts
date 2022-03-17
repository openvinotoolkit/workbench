import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { SharedModule } from '@shared/shared.module';

import { CreateProjectStagesComponent } from './create-project-stages.component';

// TODO 61174
xdescribe('CreateProjectStagesComponent', () => {
  let component: CreateProjectStagesComponent;
  let fixture: ComponentFixture<CreateProjectStagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule, NoopAnimationsModule],
      declarations: [CreateProjectStagesComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateProjectStagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
