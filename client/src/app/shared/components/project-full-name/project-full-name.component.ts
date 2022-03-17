import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { ProjectItem } from '@store/project-store/project.model';

@Component({
  selector: 'wb-project-full-name',
  templateUrl: './project-full-name.component.html',
  styleUrls: ['./project-full-name.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectFullNameComponent {
  @Input() project: ProjectItem;

  getDeviceName = ProjectItem.getDeviceName;
}
