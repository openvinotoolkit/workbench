import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectConverterService } from '@store/project-store/project-converter.service';

import { ProjectsByModelTableComponent } from './projects-by-model-table.component';

describe('ProjectsByModelTableComponent', () => {
  let component: ProjectsByModelTableComponent;
  let fixture: ComponentFixture<ProjectsByModelTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProjectsByModelTableComponent],
      providers: [ProjectConverterService],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectsByModelTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
