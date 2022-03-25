import { isEmpty } from 'lodash';

import { ModelFrameworks } from '@store/model-store/model.model';

export class ModelDownloaderDTO {
  name: string;
  task_type: string;
  framework: ModelFrameworks;
  precision: string[];
  isAvailable: boolean;
  path: string;
  description: string;
  license_url: string;

  static getId(name: string, prefix?: string): string {
    const delimiter = '-';
    return (isEmpty(prefix) ? [name] : [prefix, name]).join(delimiter);
  }
}
