import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { Int8CalibrationConfig } from '@shared/models/int8-calibration-config';

import { ConnectionService } from '../connection.service';

export interface RunJobResponse {
  jobId: number;
  projectId?: number;
}

@Injectable({
  providedIn: 'root',
})
export class TuningRestService {
  constructor(private readonly _connectionService: ConnectionService, private readonly _http: HttpClient) {}

  private readonly _int8TuningURL = `${this._connectionService.prefix}/calibration/int8`;

  public runInt8Tuning$(config: Int8CalibrationConfig): Observable<RunJobResponse> {
    return this._http.post<RunJobResponse>(this._int8TuningURL, config);
  }
}
