import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { ConnectionService } from '@core/services/api/connection.service';

import { ExportProjectConfig, StartExportProjectResponseDTO } from '@store/project-store/project.model';

@Injectable({
  providedIn: 'root',
})
export class ExportProjectRestService {
  public startExportProject$(projectId: number, config: ExportProjectConfig, tabId: string) {
    const data = {
      ...config,
      tabId,
    };
    return this.http.post<StartExportProjectResponseDTO>(
      `${this.connectionService.prefix}/project/${projectId}/export`,
      { data }
    );
  }

  constructor(private connectionService: ConnectionService, private http: HttpClient) {}
}
