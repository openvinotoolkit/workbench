import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { forkJoin, from, Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import {
  CreatedDatasetDTO,
  DatasetAugmentationDTO,
  DatasetItem,
  UploadingDatasetDTO,
  UploadingTextDatasetDTO,
} from '@store/dataset-store/dataset.model';
import { FileInfo } from '@store/model-store/model.model';

import { devCloudBasePrefix } from '@shared/constants';

import defaultImages from '../../../../../assets/img/default-dataset/images.json';
import { ConnectionService } from '../connection.service';
import { UploadFileService } from './upload-file.service';

@Injectable({
  providedIn: 'root',
})
export class DatasetsService {
  constructor(
    private http: HttpClient,
    private uploadFileService: UploadFileService,
    private connectionService: ConnectionService
  ) {}

  public uploadDataset$(
    uploadingDataset: UploadingDatasetDTO | UploadingTextDatasetDTO
  ): Observable<CreatedDatasetDTO> {
    return this.http.post<CreatedDatasetDTO>(`${this.connectionService.prefix}/dataset-upload`, uploadingDataset);
  }

  public recursiveUpload$(datasetId: number, datasetFile: File, fileId: number): Observable<void> {
    return from(this.uploadFileService.recursiveUploadDataset(datasetId, datasetFile, fileId));
  }

  public getDatasetsList$(): Observable<DatasetItem[]> {
    return this.http.get<DatasetItem[]>(`${this.connectionService.prefix}/datasets`);
  }

  public getDefaultImages$(isDevcloud: boolean): Observable<Blob[]> {
    const basePath = '/assets/img/default-dataset/';
    const folderPath = isDevcloud ? `${devCloudBasePrefix}${basePath}` : basePath;
    return of([...defaultImages]).pipe(
      switchMap((paths) => {
        const absPaths = paths.map((i) => `${folderPath}${i}`);
        return forkJoin(absPaths.map((i) => this.http.get(i, { responseType: 'blob' })));
      })
    );
  }

  public getImage$(imgName: string, isDevcloud: boolean): Observable<Blob> {
    const basePath = '/assets/img/default-dataset/';
    const folderPath = isDevcloud ? `${devCloudBasePrefix}${basePath}` : basePath;
    return this.http.get(`${folderPath}${imgName}`, { responseType: 'blob' });
  }

  public createNADataset$(
    datasetName: string,
    imagesFiles: FileInfo[],
    augmentationConfig: DatasetAugmentationDTO
  ): Observable<CreatedDatasetDTO> {
    return this.http.post<CreatedDatasetDTO>(`${this.connectionService.prefix}/datasets/not-annotated`, {
      datasetName,
      files: imagesFiles,
      augmentationConfig,
    });
  }

  public removeDataset$(datasetId: number): Observable<{ id: number }> {
    return this.http.delete<{ id: number }>(`${this.connectionService.prefix}/dataset/${datasetId}`);
  }

  public cancelDatasetUploading$(datasetId: number): Observable<{ id: number }> {
    return this.http.put<{ id: number }>(`${this.connectionService.prefix}/cancel-uploading/${datasetId}`, null);
  }
}
