import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { ConnectionService } from '@core/services/api/connection.service';

import { TargetMachineItem } from '@shared/models/pipelines/target-machines/target-machine';
import { IConfigureTargetPipeline } from '@shared/models/pipelines/target-machines/configure-target-pipeline';

@Injectable({
  providedIn: 'root',
})
export class TargetMachineService {
  constructor(private http: HttpClient, private connectionService: ConnectionService) {}

  public getTargetMachinesList$(): Observable<TargetMachineItem[]> {
    return this.http.get<TargetMachineItem[]>(`${this.connectionService.prefix}/remote-targets`);
  }

  public getPipelinesListForTargetMachine$(targetId: number): Observable<IConfigureTargetPipeline[]> {
    return this.http.get<IConfigureTargetPipeline[]>(
      `${this.connectionService.prefix}/remote-targets/${targetId}/pipelines`
    );
  }

  public addTargetMachine$(targetMachine: TargetMachineItem): Observable<TargetMachineItem> {
    return this.http.post<TargetMachineItem>(`${this.connectionService.prefix}/remote-targets`, targetMachine);
  }

  public editTargetMachine$(targetMachine: TargetMachineItem): Observable<TargetMachineItem> {
    return this.http.put<TargetMachineItem>(
      `${this.connectionService.prefix}/remote-targets/${targetMachine.targetId}`,
      targetMachine
    );
  }

  public pingTargetMachine$(targetMachineId: number): Observable<TargetMachineItem> {
    return this.http.get<TargetMachineItem>(`${this.connectionService.prefix}/remote-targets/${targetMachineId}/ping`);
  }

  public removeTargetMachine$(targetMachineId: number): Observable<{ targetId: number }> {
    return this.http.delete<{ targetId: number }>(`${this.connectionService.prefix}/remote-targets/${targetMachineId}`);
  }

  public getTargetMachine$(targetMachineId: number): Observable<TargetMachineItem> {
    return this.http.get<TargetMachineItem>(`${this.connectionService.prefix}/remote-targets/${targetMachineId}`);
  }
}
