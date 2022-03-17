import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ProjectStatus, ProjectStatusNames } from '@store/project-store/project.model';

import { StatusBarComponent } from './status-bar.component';

describe('StatusBarComponent', () => {
  let component: StatusBarComponent;
  let fixture: ComponentFixture<StatusBarComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [CommonModule, MatIconModule, MatTooltipModule],
        declarations: [StatusBarComponent],
        providers: [],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(StatusBarComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should display ready icon', () => {
    component.status = { name: ProjectStatusNames.READY } as ProjectStatus;
    fixture.detectChanges();
    const iconElement = fixture.nativeElement.querySelector('.status-bar-icon-ready');
    expect(iconElement).toBeTruthy();
  });

  it('should display error icon', () => {
    component.status = { name: ProjectStatusNames.ERROR } as ProjectStatus;
    fixture.detectChanges();
    const iconElement = fixture.nativeElement.querySelector('.status-bar-icon-error');
    expect(iconElement).toBeTruthy();
  });

  it('should display progress bar', () => {
    const progress = 10;
    component.status = { name: ProjectStatusNames.RUNNING, progress } as ProjectStatus;
    fixture.detectChanges();
    const progressElement = fixture.nativeElement.querySelector('.status-bar-progress');
    expect(progressElement).toBeTruthy();
    const progressBarElement = fixture.nativeElement.querySelector('.status-bar-progress-bar');
    expect(progressBarElement.style.width).toContain(progress);
    const progressValueElement = fixture.nativeElement.querySelector('.status-bar-progress-value');
    expect(progressValueElement.innerText).toContain(progress);
  });
});
