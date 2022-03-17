import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { Observable } from 'rxjs';

import {
  IAccuracyValidationResult,
  IRawAccuracyConfig,
} from '@store/advanced-accuracy-store/advanced-accuracy-store.models';

import { IPipeline } from '@shared/models/pipelines/pipeline';
import { AccuracyReportType, IAccuracyReport } from '@shared/models/accuracy-analysis/accuracy-report';

import { ConnectionService } from '../connection.service';

export interface IPage<T> {
  entities: T[];
  total: number;
  total_pages: number;
}

@Injectable({
  providedIn: 'root',
})
export class AccuracyRestService {
  constructor(private connectionService: ConnectionService, private http: HttpClient) {}

  public validateRawConfig$(projectId: number, config: string): Observable<IAccuracyValidationResult> {
    return this.http.post<IAccuracyValidationResult>(
      `${this.connectionService.prefix}/projects/${projectId}/accuracy/config/raw/validate`,
      { config }
    );
  }

  public loadRawConfig$(projectId: number): Observable<IRawAccuracyConfig> {
    return this.http.get<IRawAccuracyConfig>(
      `${this.connectionService.prefix}/projects/${projectId}/accuracy/config/raw`
    );
  }

  public saveRawConfig$(projectId: number, config: IRawAccuracyConfig): Observable<IRawAccuracyConfig> {
    return this.http.put<IRawAccuracyConfig>(
      `${this.connectionService.prefix}/projects/${projectId}/accuracy/config/raw`,
      { config }
    );
  }

  // todo: check if we can delete raw config on basic config save automatically
  public deleteRawConfig$(projectId: number): Observable<void> {
    return this.http.delete<void>(`${this.connectionService.prefix}/projects/${projectId}/accuracy/config/raw`);
  }

  public createAccuracyReport$(projectId: number, reportType: AccuracyReportType): Observable<IPipeline> {
    return this.http.post<IPipeline>(`${this.connectionService.prefix}/projects/${projectId}/accuracy/reports`, {
      reportType,
    });
  }

  public getReports$(projectId: number): Observable<IAccuracyReport[]> {
    return this.http.get<IAccuracyReport[]>(`${this.connectionService.prefix}/projects/${projectId}/accuracy/reports`);
  }

  public getPagedReportEntities$<T>(projectId: number, reportId: number, params: HttpParams): Observable<IPage<T>> {
    params = new HttpParams({ fromString: params.toString() }).set('count', 'true');
    return this.http.get<IPage<T>>(
      `${this.connectionService.prefix}/projects/${projectId}/accuracy/reports/${reportId}/entities`,
      { params }
    );
  }

  public getReportEntities$<T>(projectId: number, reportId: number, params: HttpParams): Observable<T[]> {
    return this.http.get<T[]>(
      `${this.connectionService.prefix}/projects/${projectId}/accuracy/reports/${reportId}/entities`,
      { params }
    );
  }

  public getDatasetImage$(datasetId: number, imgName: string): Observable<Blob> {
    return this.http.get(`${this.connectionService.prefix}/dataset/${datasetId}/image/${imgName}`, {
      responseType: 'blob',
    });
  }
}
