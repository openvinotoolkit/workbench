import { Injectable } from '@angular/core';

import { ConnectionService } from '@core/services/api/connection.service';

import openvinoNotebooksMetadata from '../../../../assets/data/openvino-notebooks.json';

interface IOpenVINONotebookMetadata {
  name: string;
  filename?: string;
  description: string;
}

export interface IOpenVINONotebookLink {
  name: string;
  url: string;
  description: string;
}

@Injectable({
  providedIn: 'root',
})
export class JupyterLabService {
  private readonly _jupyterLabTreeSlug = 'jupyter/lab/tree';
  private readonly _fileBrowserPathParamName = 'file-browser-path';

  private readonly _directoryNames = {
    tutorials: 'tutorials',
    sampleApplication: 'sample_application',
    openvinoNotebooks: 'openvino_notebooks',
  };

  private readonly _introFileName = 'intro.md';

  openvinoNotebooksLinks: IOpenVINONotebookLink[] = null;

  private readonly _baseURL = this._connectionService.fullDomainPath;

  constructor(private _connectionService: ConnectionService) {
    this.openvinoNotebooksLinks = this._getOpenvinoNotebooksLinks();
  }

  private _getOpenvinoNotebooksLinks(): IOpenVINONotebookLink[] {
    return (<IOpenVINONotebookMetadata[]>openvinoNotebooksMetadata).map(({ name, filename, description }) => {
      const notebookFilePath = filename ? `${name}/${filename}` : `${name}/${name}.ipynb`;
      const notebookName = filename?.split('.')[0] || name;
      const url = this._getOpenvinoNotebookURL(notebookFilePath);
      return {
        name: notebookName,
        url,
        description,
      };
    });
  }

  private _getOpenvinoNotebookURL(notebookFilePath: string): string {
    const { tutorials, openvinoNotebooks } = this._directoryNames;
    return this.getFileUrl(`${tutorials}/${openvinoNotebooks}/${notebookFilePath}`);
  }

  private _getFileBrowserPathSearch(pathInNotebook: string): string {
    return `?${this._fileBrowserPathParamName}=${pathInNotebook}`;
  }

  getFileUrl(filePath: string): string {
    const url = new URL(this._baseURL);
    url.pathname = `/${this._jupyterLabTreeSlug}/${filePath}`;
    url.search = this._getFileBrowserPathSearch(filePath);
    return url.toString();
  }

  get introURL(): string {
    return this.getFileUrl(`${this._directoryNames.tutorials}/${this._introFileName}`);
  }

  getTutorialURL(tutorialDirectory: string | undefined, tutorialFileName: string = null): string {
    if (!tutorialDirectory) {
      return this.introURL;
    }
    const notebookFileName = tutorialFileName || `tutorial_${tutorialDirectory}.ipynb`;
    return this.getFileUrl(`${this._directoryNames.tutorials}/${tutorialDirectory}/${notebookFileName}`);
  }

  get sampleApplicationTutorialURL(): string {
    return this.getTutorialURL(this._directoryNames.sampleApplication);
  }
}
