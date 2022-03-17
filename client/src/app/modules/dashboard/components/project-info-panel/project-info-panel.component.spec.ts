import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectInfoPanelComponent } from './project-info-panel.component';

describe('ProjectInfoPanelComponent', () => {
  let component: ProjectInfoPanelComponent;
  let fixture: ComponentFixture<ProjectInfoPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProjectInfoPanelComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectInfoPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
