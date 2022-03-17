import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { ConnectionService } from '@core/services/api/connection.service';

import { FrameworksAvailability, SupportedFeaturesPreview } from '@store/globals-store/globals.state';

@Injectable({
  providedIn: 'root',
})
export class EnvironmentService {
  constructor(private http: HttpClient, private connectionService: ConnectionService) {}

  public getFrameworks$() {
    return this.http.get<FrameworksAvailability>(`${this.connectionService.prefix}/environment/frameworks/status`);
  }

  public getSupportedFeaturesPreview$() {
    return this.http.get<SupportedFeaturesPreview[]>(`${this.connectionService.prefix}/supported-preview-features`);
  }

  public stopSetup$(): Observable<{}> {
    return this.http.delete(`${this.connectionService.prefix}/environment/setup/stop`);
  }
}
