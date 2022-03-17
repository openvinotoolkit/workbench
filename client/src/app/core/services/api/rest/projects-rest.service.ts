import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { ProjectItemDTO } from '@store/project-store/project.model';

import { ConnectionService } from '../connection.service';

@Injectable({
  providedIn: 'root',
})
export class ProjectsRestService {
  constructor(private connectionService: ConnectionService, private http: HttpClient) {}

  public getAllProjects$(modelId?: number): Observable<ProjectItemDTO[]> {
    const params = modelId
      ? {
          includeExecInfo: true.toString(),
          allLevels: true.toString(),
          modelId: modelId.toString(),
        }
      : { includeExecInfo: true.toString() };
    return this.http.get<ProjectItemDTO[]>(`${this.connectionService.prefix}/projects-info/`, {
      params,
    });
  }

  public getProjectInfo$(projectId: number): Observable<ProjectItemDTO> {
    return this.http.get<ProjectItemDTO>(`${this.connectionService.prefix}/project-info/${projectId}`);
  }

  public deleteProject$(projectId: number): Observable<{ id: number }> {
    return this.http.delete<{ id: number }>(`${this.connectionService.prefix}/delete-project/${projectId}`);
  }

  public getProjectReport$(projectId: number, tabId: string): Observable<{ id: number }> {
    return this.http.get<{ id: number }>(`${this.connectionService.prefix}/project-report/${projectId}`, {
      params: { tabId },
    });
  }
}
