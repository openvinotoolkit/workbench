import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { ConnectionService } from '@core/services/api/connection.service';

import { DownloadItemDTO } from '@store/globals-store/download-log.model';

import { UserMetaInfo } from '@store/globals-store/globals.state';

interface IUnloadRequest {
  datasetIds: number[];
  modelIds: number[];
  pipelineIds: number[];
  uploadingIds: number[];
}

@Injectable({
  providedIn: 'root',
})
export class CommonRestService {
  public downloadFile$(path: string) {
    const options = {
      responseType: 'blob' as 'blob',
      observe: 'response' as 'response',
    };
    return this.http.get(`${this.connectionService.prefix}/artifact/${path}`, options);
  }

  public initLogDownloading$(tabId): Observable<DownloadItemDTO> {
    return this.http.post<DownloadItemDTO>(`${this.connectionService.prefix}/get-log`, { tabId });
  }

  public setUserMeta$(userMeta: UserMetaInfo): Observable<UserMetaInfo> {
    return this.http.post<UserMetaInfo>(`${this.connectionService.prefix}/user-info`, userMeta);
  }

  unload(accessToken: string, data: IUnloadRequest): void {
    fetch(`${this.connectionService.prefix}/unload`, {
      method: 'POST',
      mode: 'same-origin',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(data),
      keepalive: true,
      credentials: 'include',
    });
  }

  public eraseAll$(): Observable<Record<string, never>> {
    return this.http.delete<Record<string, never>>(`${this.connectionService.prefix}/erase-all`);
  }

  constructor(private http: HttpClient, private connectionService: ConnectionService) {}
}
