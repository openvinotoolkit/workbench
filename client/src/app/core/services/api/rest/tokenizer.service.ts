import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { ConnectionService } from '@core/services/api/connection.service';

import { FileInfo } from '@store/model-store/model.model';

import { ITokenizer, TokenizerType } from '@shared/models/tokenizer/tokenizer';

import { ITokenizerDTO } from '../../../../modules/model/pages/import-tokenizer-page/tokenizer-dto.model';

type CreateTokenizerRequest = Omit<ITokenizerDTO, 'mergesFile' | 'vocabFile'> & {
  vocabFile: FileInfo;
  mergesFile?: FileInfo;
};

interface ICreateTokenizerResponse {
  tokenizer: ITokenizer;
  fileIds: {
    vocabFile: number;
    mergesFile?: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class TokenizerService {
  constructor(private connectionService: ConnectionService, private http: HttpClient) {}

  public create$(modelId: number, data: ITokenizerDTO): Observable<ICreateTokenizerResponse> {
    const request: CreateTokenizerRequest = {
      ...data,
      vocabFile: new FileInfo(data.vocabFile),
    };

    if (data.type === TokenizerType.BPE) {
      request.mergesFile = new FileInfo(data.mergesFile);
    }

    return this.http.post<ICreateTokenizerResponse>(
      `${this.connectionService.prefix}/model/${modelId}/tokenizers`,
      request
    );
  }

  public cancelUpload$(tokenizerId: number): Observable<void> {
    return this.http.put<void>(`${this.connectionService.prefix}/cancel-uploading/${tokenizerId}`, null);
  }

  public load$(modelId: number): Observable<ITokenizer[]> {
    return this.http.get<ITokenizer[]>(`${this.connectionService.prefix}/model/${modelId}/tokenizers`);
  }

  public remove$(modelId: number, tokenizerId: number): Observable<void> {
    return this.http.delete<void>(`${this.connectionService.prefix}/model/${modelId}/tokenizers/${tokenizerId}`);
  }

  public select$(modelId: number, tokenizerId: number): Observable<ITokenizer> {
    return this.http.post<ITokenizer>(
      `${this.connectionService.prefix}/model/${modelId}/tokenizers/${tokenizerId}/select`,
      null
    );
  }

  public get$(modelId: number, tokenizerId: number): Observable<ITokenizer> {
    return this.http.get<ITokenizer>(`${this.connectionService.prefix}/model/${modelId}/tokenizers/${tokenizerId}`);
  }
}
