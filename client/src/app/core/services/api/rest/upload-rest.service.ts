import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { ConnectionService } from '../connection.service';

@Injectable({
  providedIn: 'root',
})
export class UploadRestService {
  constructor(private connectionService: ConnectionService, private http: HttpClient) {}

  public newDatasetChunk(fileId: number, data: FormData): Promise<object> {
    return this.newChunk(fileId, data, `${this.connectionService.prefix}/dataset-upload`);
  }

  public newModelChunk(fileId: number, data: FormData): Promise<object> {
    return this.newChunk(fileId, data, `${this.connectionService.prefix}/model-upload`);
  }

  public newFileChunk(fileId: number, data: FormData): Promise<object> {
    return this.newChunk(fileId, data, `${this.connectionService.prefix}/file/upload`);
  }

  public newTestImageChunk(fileId: number, data: FormData): Promise<object> {
    return this.newChunk(fileId, data, `${this.connectionService.prefix}/inference/test-images/upload`);
  }

  private newChunk(fileId: number, data: FormData, url: string): Promise<object> {
    return this.http.post(`${url}/${fileId}`, data).toPromise();
  }
}
