import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { ILabelSet } from '@store/inference-test-image-store/inference-test-image-models';

import { ConnectionService } from '../connection.service';

@Injectable({
  providedIn: 'root',
})
export class LabelSetsService {
  constructor(private http: HttpClient, private connectionService: ConnectionService) {}

  public get$() {
    return this.http.get<ILabelSet[]>(`${this.connectionService.prefix}/label-sets`);
  }
}
