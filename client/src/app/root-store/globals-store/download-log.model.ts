import { ProjectStatus } from '@store/project-store/project.model';

export interface DownloadItemDTO {
  tabId: string;
  jobId: number;
  artifactId?: number;
}

export interface DownloadItemSocketDTO {
  artifactId: number;
  tabId: string;
  status: ProjectStatus;
  creationTimestamp: number;
}
