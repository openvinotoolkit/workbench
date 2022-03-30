import { Injectable } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';

import { forkJoin, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ConnectionService } from '@core/services/api/connection.service';
import { IS_ERROR_NOTIFICATION_DISABLED } from '@core/services/api/context-tokens';

import { ModelItem } from '@store/model-store/model.model';

import { IHuggingfaceModel } from '@shared/models/huggingface/huggingface-model';

// todo: fix mess with tags - combine on server side
interface IModelsResponse {
  models: IHuggingfaceModel[];
  tags: {
    applied: IHuggingfaceAppliedModelTags;
    available: {
      modelTypes: string[];
    };
  };
}

// TODO Consider moving to shared models (e.g. huggingface directory)
export interface IHFModelsData {
  models: IHuggingfaceModel[];
  tags: {
    applied: IHuggingfaceAppliedModelTags;
    available: IHuggingfaceAvailableTags;
  };
}

export interface IHuggingfaceAppliedModelTags {
  pipelineTags: string[];
  libraries: string[];
}

export interface IHuggingfaceModelTagsResponse {
  languages: string[];
  licenses: string[];
}

export interface IHuggingfaceAvailableTags extends IHuggingfaceModelTagsResponse {
  modelTypes: string[];
}

@Injectable({
  providedIn: 'root',
})
export class HuggingfaceService {
  constructor(private readonly _connectionService: ConnectionService, private readonly _http: HttpClient) {}

  private _getModels$(): Observable<IModelsResponse> {
    return this._http.get<IModelsResponse>(`${this._connectionService.prefix}/huggingface/models`);
  }

  private _getModelTags$(): Observable<IHuggingfaceModelTagsResponse> {
    return this._http.get<IHuggingfaceModelTagsResponse>(`${this._connectionService.prefix}/huggingface/model-tags`);
  }

  getModelsData$(): Observable<IHFModelsData> {
    return forkJoin([this._getModels$(), this._getModelTags$()]).pipe(
      map(([modelsResponse, tagsResponse]) => {
        return {
          models: modelsResponse.models,
          tags: {
            applied: modelsResponse.tags.applied,
            available: {
              modelTypes: modelsResponse.tags.available.modelTypes,
              ...tagsResponse,
            },
          },
        };
      })
    );
  }

  importModel$(id: string): Observable<ModelItem> {
    return this._http.post<ModelItem>(`${this._connectionService.prefix}/huggingface/models/import`, { id });
  }

  getModelReadme$(id: string): Observable<string> {
    const params = new HttpParams({ fromObject: { id } });
    return this._http.get(`${this._connectionService.prefix}/huggingface/readme`, {
      params,
      context: new HttpContext().set(IS_ERROR_NOTIFICATION_DISABLED, true),
      responseType: 'text',
    });
  }
}
