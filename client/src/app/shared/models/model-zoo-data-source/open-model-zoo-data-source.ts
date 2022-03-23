import { ModelDownloaderDTO } from '@shared/models/dto/model-downloader-dto';

import { BaseModelZooDataSource } from './base-model-zoo-data-source';

export class OpenModelZooDataSource extends BaseModelZooDataSource<ModelDownloaderDTO> {
  filterPredicate(data: ModelDownloaderDTO, filter: string): boolean {
    return data.name.toLowerCase().includes(filter.trim().toLowerCase());
  }
}
