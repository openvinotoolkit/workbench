import { ModelDownloaderDTO } from '@shared/models/dto/model-downloader-dto';

import { BaseModelZooDataSource } from './base-model-zoo-data-source';

export class OpenModelZooDataSource extends BaseModelZooDataSource<ModelDownloaderDTO> {
  protected _searchIdentityField: keyof ModelDownloaderDTO = 'name';
}
