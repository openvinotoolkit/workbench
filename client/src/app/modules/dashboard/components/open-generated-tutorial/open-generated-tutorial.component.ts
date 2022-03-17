import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { MessagesService } from '@core/services/common/messages.service';
import { GoogleAnalyticsService } from '@core/services/common/google-analytics.service';
import { JupyterLabService } from '@core/services/common/jupyter-lab.service';

import { InfoHint } from '@shared/components/info-hint/info-hint.component';

@Component({
  selector: 'wb-open-generated-tutorial',
  templateUrl: './open-generated-tutorial.component.html',
  styleUrls: ['../open-sample-tutorial/open-sample-tutorial.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpenGeneratedTutorialComponent {
  @Input()
  jupyterNotebookPath: string;

  @Input()
  modelName: string;

  public notebookNotAvailableWarning: InfoHint = {
    message: this._messagesService.hintMessages.jupyterLab.notebookNotAvailable,
    type: 'warning',
  };

  constructor(
    private _messagesService: MessagesService,
    private _gAnalyticsService: GoogleAnalyticsService,
    private _jupyterLabService: JupyterLabService
  ) {}

  get generatedTutorialDescription(): string {
    return this._messagesService.getHint('jupyterLab', 'generatedTutorialDescription', { modelName: this.modelName });
  }

  get jupyterNotebookURL(): string {
    return this._jupyterLabService.getFileUrl(this.jupyterNotebookPath);
  }

  openGeneratedTutorial(): void {
    this._gAnalyticsService.emitOpenJupyterGeneratedEvent();
    window.open(this.jupyterNotebookURL, '_blank');
  }
}
