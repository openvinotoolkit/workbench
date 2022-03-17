import { ProjectStatus } from '@store/project-store/project.model';

export interface Artifact {
  id: number;
  name: string;
  size: number;
  path: string;
  date: number;
  status: ProjectStatus;
}
