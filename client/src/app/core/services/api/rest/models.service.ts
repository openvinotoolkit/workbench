import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { from, Observable } from 'rxjs';

import {
  UploadingModelDTO,
  CreatedModelDTO,
  ModelConvertConfigDTO,
  EditModelConvertConfigDTO,
  ModelItem,
  UploadingTF2SavedModelDTO,
  InputConfiguration,
} from '@store/model-store/model.model';

import { ModelDownloaderDTO } from '@shared/models/dto/model-downloader-dto';
import { IAccuracyConfiguration } from '@shared/models/accuracy';

import { ConnectionService } from '../connection.service';
import { UploadFileService } from './upload-file.service';

@Injectable({
  providedIn: 'root',
})
export class ModelsService {
  constructor(
    private http: HttpClient,
    private uploadFileService: UploadFileService,
    private connectionService: ConnectionService
  ) {}

  public getOriginalModelGraph$(modelId: number): Observable<{ xmlContent: string }> {
    return this.http.get<{ xmlContent: string }>(`${this.connectionService.prefix}/xml-model/${modelId}`);
  }

  public getModelsToDownload$(): Observable<ModelDownloaderDTO[]> {
    return this.http.get<ModelDownloaderDTO[]>(`${this.connectionService.prefix}/downloader-models`);
  }

  public downloadOMZModel$(modelName: string, precision: string): Observable<ModelItem> {
    return this.http.post<ModelItem>(`${this.connectionService.prefix}/downloader-models`, {
      modelName,
      precision,
    });
  }

  public uploadModel$(uploadingModel: UploadingModelDTO | UploadingTF2SavedModelDTO): Observable<CreatedModelDTO> {
    return this.http.post<CreatedModelDTO>(`${this.connectionService.prefix}/model-upload`, uploadingModel);
  }

  public convertModel$(
    convertConfig: ModelConvertConfigDTO
  ): Observable<{ irId: number; modelOptimizerJobId: number }> {
    return this.http.post<{ irId: number; modelOptimizerJobId: number }>(
      `${this.connectionService.prefix}/convert`,
      convertConfig
    );
  }

  public editModelConvert$(
    editConvertConfig: EditModelConvertConfigDTO
  ): Observable<{ irId: number; modelOptimizerJobId: number }> {
    return this.http.post<{ irId: number; modelOptimizerJobId: number }>(
      `${this.connectionService.prefix}/convert-edit`,
      editConvertConfig
    );
  }

  public recursiveUpload$(modelId: number, modelFile: File, fileId: number): Observable<void> {
    return from(this.uploadFileService.recursiveUploadModel(modelId, modelFile, fileId));
  }

  public getAllModelsList$(): Observable<ModelItem[]> {
    return this.http.get<ModelItem[]>(`${this.connectionService.prefix}/models/all`);
  }

  public getModel$(modelId: number): Observable<ModelItem> {
    return this.http.get<ModelItem>(`${this.connectionService.prefix}/model/${modelId}`);
  }

  public downloadModel$(
    modelId: number,
    name: string,
    tabId: string
  ): Observable<{ jobId: number; message: string; artifactId: number }> {
    return this.http.get<{ jobId: number; message: string; artifactId: number }>(
      `${this.connectionService.prefix}/model-archive/${modelId}`,
      { params: { name, tabId } }
    );
  }

  public removeModel$(modelId: number) {
    return this.http.delete<{ id: number }>(`${this.connectionService.prefix}/model/${modelId}`);
  }

  public cancelModelUploading$(modelId: number) {
    return this.http.put<{ id: number }>(`${this.connectionService.prefix}/cancel-uploading/${modelId}`, null);
  }

  public setAccuracyConfig$(modelId: number, accuracyData: IAccuracyConfiguration): Observable<ModelItem> {
    return this.http.put<ModelItem>(`${this.connectionService.prefix}/model/${modelId}`, accuracyData);
  }

  public configureModel$(modelId: number, inputsConfigurations: InputConfiguration[]): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${this.connectionService.prefix}/model/${modelId}/configure`, {
      inputsConfigurations,
    });
  }
}
