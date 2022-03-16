import { ModelDownloaderDTO } from '@shared/models/dto/model-downloader-dto';

import { BaseModelZooDataSource, ModelZooSort } from './base-model-zoo-data-source';

export class OpenModelZooDataSource extends BaseModelZooDataSource<ModelDownloaderDTO> {
  protected _searchIdentityField: keyof ModelDownloaderDTO = 'name';

  sortOptions: ModelZooSort<ModelDownloaderDTO>[] = [
    { field: 'name', direction: 'asc', label: 'Name (A-Z)' },
    { field: 'name', direction: 'desc', label: 'Name (Z-A)' },
  ];
}
