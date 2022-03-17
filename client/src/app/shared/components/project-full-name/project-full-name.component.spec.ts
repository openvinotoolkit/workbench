import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ProjectFullNameComponent } from './project-full-name.component';

describe('ProjectFullNameComponent', () => {
  let component: ProjectFullNameComponent;
  let fixture: ComponentFixture<ProjectFullNameComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [ProjectFullNameComponent],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectFullNameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
