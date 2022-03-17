import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Dictionary } from '@ngrx/entity';
import { Observable } from 'rxjs';

import { PackageSizeInfo, UserMetaInfo } from '@store/globals-store/globals.state';
import { TransformationsConfig } from '@store/model-store/model.model';
import { IAccuracyPipeline } from '@store/accuracy-analysis-store/accuracy-analysis-store.models';

import { IProfilingPipeline } from '@shared/models/pipelines/profiling-pipeline';
import { IInt8CalibrationPipeline } from '@shared/models/pipelines/int8-calibration-pipeline';

import { ConnectionService } from '../connection.service';

export interface SyncResponseDTO {
  predefinedTransformationsConfigs: TransformationsConfig[];
  codes: Dictionary<number>;
  taskIsRunning: boolean;
  runningProfilingPipelines: IProfilingPipeline[];
  runningAccuracyPipelines: IAccuracyPipeline[];
  runningInt8CalibrationPipelines: IInt8CalibrationPipeline[];
  time: number;
  version: string;
  internetConnection: boolean;
  rejectUnauthorized: boolean;
  packageSizes: PackageSizeInfo;
  userMeta: UserMetaInfo;
  isDevCloudMode: boolean;
  isDevCloudAvailable: boolean;
  session: ISession;
  isJupyterAvailable: boolean;
  isAuthEnabled: boolean;
  launchedViaWrapper: boolean;
}

export interface ISession {
  created: number;
  ttlSeconds: number;
}

@Injectable({
  providedIn: 'root',
})
export class SyncService {
  constructor(private connectionService: ConnectionService, private http: HttpClient) {}

  public sync$(): Observable<SyncResponseDTO> {
    return this.http.get<SyncResponseDTO>(`${this.connectionService.prefix}/sync`);
  }
}
