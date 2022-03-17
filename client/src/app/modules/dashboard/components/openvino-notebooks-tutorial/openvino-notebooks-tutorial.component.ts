import { ChangeDetectionStrategy, Component } from '@angular/core';

import { MessagesService } from '@core/services/common/messages.service';
import { IOpenVINONotebookLink, JupyterLabService } from '@core/services/common/jupyter-lab.service';
import { GoogleAnalyticsService } from '@core/services/common/google-analytics.service';

@Component({
  selector: 'wb-openvino-notebooks-tutorial',
  templateUrl: './openvino-notebooks-tutorial.component.html',
  styleUrls: ['./openvino-notebooks-tutorial.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpenvinoNotebooksTutorialComponent {
  readonly openvinoNotebooksDescription = this._messagesService.hintMessages.jupyterLab.openVINONotebooksDescription;
  readonly openvinoNotebooksLinks = this._jupyterLabService.openvinoNotebooksLinks;

  constructor(
    private _messagesService: MessagesService,
    private _jupyterLabService: JupyterLabService,
    private _gAnalyticsService: GoogleAnalyticsService
  ) {}

  openOpenvinoNotebook({ url, name }: IOpenVINONotebookLink): void {
    this._gAnalyticsService.emitOpenOpenVINONotebookEvent(name);
    window.open(url, '_blank');
  }
}
