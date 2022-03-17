import { Injectable } from '@angular/core';

import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root',
})
export class ConnectionService {
  private readonly _apiPrefix = 'api/v1';

  get fullDomainPath(): string {
    return document.baseURI;
  }

  get prefix(): string {
    return `${this.fullDomainPath}${this._apiPrefix}`;
  }

  get socketPrefix(): string {
    return this.fullDomainPath;
  }

  get tabId(): string {
    if (!sessionStorage.tabID) {
      sessionStorage.tabID = uuidv4();
    }
    return sessionStorage.tabID;
  }
}
