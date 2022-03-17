import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { ConnectionService } from '@core/services/api/connection.service';

import { DeploymentConfig, ProjectStatus } from '@store/project-store/project.model';

import { DeviceTargets } from '@shared/models/device';

export interface StartDeploymentResponseDTO {
  jobId: number | null;
  modelName: string;
  artifactId: number;
  includeModel: boolean;
  targets: DeviceTargets[];
  message?: string;
  status?: ProjectStatus;
  projectId?: number;
  operatingSystem: string;
}

@Injectable({
  providedIn: 'root',
})
export class DeployRestService {
  public startDeployment$(config: DeploymentConfig, tabId: string) {
    const data = {
      ...config,
      tabId,
    };
    return this.http.post<StartDeploymentResponseDTO>(`${this.connectionService.prefix}/deployment`, data);
  }

  constructor(private connectionService: ConnectionService, private http: HttpClient) {}
}
