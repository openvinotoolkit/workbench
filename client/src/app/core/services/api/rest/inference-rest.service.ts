import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { IInferenceResult } from '@store/inference-history-store/inference-history.model';
import { FileInfo } from '@store/model-store/model.model';
import { CompoundJobForInferenceDTO } from '@store/inference-result-store/inference-result.model';

import { CompoundInferenceConfig } from '@shared/models/compound-inference-config';
import { IInferenceTestImagePipeline } from '@shared/models/pipelines/inference-test-image-pipeline';
import { IVisualizationConfiguration } from '@shared/models/accuracy';

import { ConnectionService } from '../connection.service';
import { VisualizationType } from '../../../../modules/accuracy/components/visualization/network-output/original-image-controls/original-image-controls.component';

export interface RunInferenceResponseDTO {
  jobId: number;
  projectId: number;
  originalModelId: number;
  inferences: IInferenceResult[];
}

@Injectable({
  providedIn: 'root',
})
export class InferenceRestService {
  constructor(private http: HttpClient, private connectionService: ConnectionService) {}

  public runInference$(config: CompoundInferenceConfig): Observable<RunInferenceResponseDTO> {
    return this.http.post<RunInferenceResponseDTO>(`${this.connectionService.prefix}/profile`, config.prepareForRest());
  }

  public getJobInfoForInferenceResult$(
    jobId: number,
    inferenceResultId: number
  ): Observable<CompoundJobForInferenceDTO> {
    return this.http.get<CompoundJobForInferenceDTO>(`${this.connectionService.prefix}/job/${jobId}`, {
      params: { inferenceResultId: inferenceResultId.toString() },
    });
  }

  public getExecGraphForJob$(inferenceResultId: number): Observable<{ execGraph: string }> {
    return this.http.get<{ execGraph: string }>(`${this.connectionService.prefix}/exec-graph/${inferenceResultId}`);
  }

  public getInferenceResults$(projectId: number) {
    return this.http.get<IInferenceResult[]>(`${this.connectionService.prefix}/inference-history/${projectId}`);
  }

  public cancelJob$(jobId: number): Observable<{ jobId: number }> {
    return this.http.put<{ jobId: number }>(`${this.connectionService.prefix}/cancel-job/${jobId}`, null);
  }

  public startInferenceTestImage$(
    modelId: number,
    imageId: number,
    deviceId?: number,
    visualizationConfig?: IVisualizationConfiguration,
    visualizationType?: VisualizationType
  ) {
    return this.http.post<IInferenceTestImagePipeline>(
      `${this.connectionService.prefix}/inference/test-images/${imageId}/models/${modelId}/infer`,
      { visualizationConfig, deviceId, visualizationType }
    );
  }

  public startTestImageUpload$(file: FileInfo, mask?: FileInfo) {
    return this.http.post<{ fileId: number; maskId: number; imageId: number }>(
      `${this.connectionService.prefix}/inference/test-images/upload`,
      mask ? { file, mask } : { file }
    );
  }

  public getInferenceReport$(inferenceId: number, tabId: string): Observable<{ id: number }> {
    return this.http.get<{ id: number }>(`${this.connectionService.prefix}/inference-report/${inferenceId}`, {
      params: { tabId },
    });
  }
}
